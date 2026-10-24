import { prisma } from '../db/prisma.js';
import { generateStudySchedule, verifySessionRewardEligibility } from '@ai-study/domain';
import { RewardService } from './rewardService.js';

export class PlannerService {
  static async previewSchedule(userId, options) {
    const { topics, exams, start, end } = await this._gatherSchedulingContext(userId, options);

    const result = generateStudySchedule(topics, {
      startDate: start,
      targetEndDate: end,
      dailyHoursLimit: options.dailyHoursLimit || 4,
      sessionDurationMinutes: options.sessionDurationMinutes || 45,
      breakMinutes: options.breakMinutes || 10,
      exams
    });

    return result;
  }

  static async confirmSchedule(userId, options) {
    const { topics, exams, start, end } = await this._gatherSchedulingContext(userId, options);

    const schedule = generateStudySchedule(topics, {
      startDate: start,
      targetEndDate: end,
      dailyHoursLimit: options.dailyHoursLimit || 4,
      sessionDurationMinutes: options.sessionDurationMinutes || 45,
      breakMinutes: options.breakMinutes || 10,
      exams
    });

    // Deactivate previous active plans
    await prisma.studyPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    // Commit new plan and sessions in transaction
    const newPlan = await prisma.studyPlan.create({
      data: {
        userId,
        title: `Adaptive Study Plan (${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)})`,
        startDate: start,
        targetEndDate: end,
        isActive: true,
        totalPlannedMinutes: schedule.totalPlannedMinutes,
        sessions: {
          create: schedule.sessions.map((s) => ({
            topicId: s.topicId,
            scheduledStart: s.scheduledStart,
            scheduledEnd: s.scheduledEnd,
            durationMinutes: s.durationMinutes,
            sessionType: s.sessionType,
            status: 'PLANNED'
          }))
        }
      },
      include: {
        sessions: {
          include: {
            topic: {
              include: { unit: { include: { subject: true } } }
            }
          }
        }
      }
    });

    // Award onboarding/milestone reward for generating first plan
    await RewardService.processRewardEvent({
      userId,
      eventType: 'PLAN_GENERATED',
      sourceEventId: newPlan.id,
      xp: 20,
      description: 'Generated personalized adaptive study plan.'
    });

    return {
      plan: newPlan,
      scheduleMetrics: {
        isFeasible: schedule.isFeasible,
        feasibilityWarning: schedule.feasibilityWarning,
        totalPlannedMinutes: schedule.totalPlannedMinutes,
        bufferDays: schedule.bufferDays
      }
    };
  }

  static async getSessions(userId, { startDate, endDate, status } = {}) {
    const where = {
      studyPlan: { userId }
    };

    if (startDate && endDate) {
      where.scheduledStart = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      where.status = status;
    }

    return prisma.studySession.findMany({
      where,
      include: {
        topic: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { scheduledStart: 'asc' }
    });
  }

  static async startSession(userId, sessionId) {
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, studyPlan: { userId } }
    });

    if (!session) {
      const err = new Error('Session not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        actualStart: session.actualStart || new Date()
      }
    });
  }

  static async completeSession(userId, sessionId, { actualDurationMinutes, reflectionScore, notes }) {
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, studyPlan: { userId } },
      include: { topic: true, studyPlan: true }
    });

    if (!session) {
      const err = new Error('Session not found.');
      err.statusCode = 404;
      throw err;
    }

    const verification = verifySessionRewardEligibility({
      status: session.status,
      plannedMinutes: session.durationMinutes,
      actualMinutes: actualDurationMinutes
    });

    const updatedSession = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date(),
        actualDurationMinutes,
        reflectionScore,
        notes
      }
    });

    // Update topic confidence and lastStudiedAt
    if (reflectionScore) {
      await prisma.topic.update({
        where: { id: session.topicId },
        data: {
          confidence: reflectionScore,
          lastStudiedAt: new Date()
        }
      });
    }

    // Award verified XP
    let rewardResult = null;
    if (verification.eligible) {
      rewardResult = await RewardService.processRewardEvent({
        userId,
        eventType: 'SESSION_COMPLETE',
        sourceEventId: sessionId,
        xp: 25,
        description: `Completed verified study session on ${session.topic.title}`
      });
    }

    return {
      session: updatedSession,
      reward: rewardResult,
      verificationNote: verification.reason
    };
  }

  static async rescheduleSession(userId, sessionId, { newStart, newEnd }) {
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, studyPlan: { userId } }
    });

    if (!session) {
      const err = new Error('Session not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.studySession.update({
      where: { id: sessionId },
      data: {
        scheduledStart: new Date(newStart),
        scheduledEnd: new Date(newEnd),
        status: 'RESCHEDULED'
      }
    });
  }

  static async recoverMissedSessions(userId) {
    const now = new Date();
    // Find past sessions still marked PLANNED
    const pastSessions = await prisma.studySession.findMany({
      where: {
        studyPlan: { userId, isActive: true },
        scheduledEnd: { lt: now },
        status: { in: ['PLANNED', 'IN_PROGRESS'] }
      },
      include: { topic: true }
    });

    if (pastSessions.length === 0) {
      return { recoveredCount: 0, message: 'No missed sessions found.' };
    }

    // Push each missed session to tomorrow 09:00 onwards
    let currentShift = new Date(now);
    currentShift.setDate(currentShift.getDate() + 1);
    currentShift.setHours(10, 0, 0, 0);

    for (const session of pastSessions) {
      const duration = session.durationMinutes;
      const newEnd = new Date(currentShift.getTime() + duration * 60 * 1000);

      await prisma.studySession.update({
        where: { id: session.id },
        data: {
          scheduledStart: currentShift,
          scheduledEnd: newEnd,
          status: 'RESCHEDULED'
        }
      });

      // Shift next slot by duration + 10m break
      currentShift = new Date(newEnd.getTime() + 10 * 60 * 1000);
    }

    return {
      recoveredCount: pastSessions.length,
      message: `Successfully rescheduled ${pastSessions.length} missed sessions to upcoming free slots.`
    };
  }

  // Helper to gather curriculum topics and exams
  static async _gatherSchedulingContext(userId, options) {
    const subjects = await prisma.subject.findMany({
      where: {
        userId,
        archived: false,
        ...(options.subjectIds?.length ? { id: { in: options.subjectIds } } : {})
      },
      include: {
        examinations: { where: { completed: false } },
        units: {
          include: {
            topics: {
              where: { status: { not: 'MASTERED' } }
            }
          }
        }
      }
    });

    const topics = [];
    const exams = [];

    for (const subj of subjects) {
      for (const ex of subj.examinations) {
        exams.push({
          subjectId: subj.id,
          title: ex.title,
          examDate: ex.examDate
        });
      }
      for (const unit of subj.units) {
        for (const t of unit.topics) {
          topics.push({
            id: t.id,
            title: t.title,
            unitId: unit.id,
            subjectId: subj.id,
            subjectName: subj.name,
            estimatedMinutes: t.estimatedMinutes,
            difficulty: t.difficulty,
            importance: t.importance,
            confidence: t.confidence,
            status: t.status
          });
        }
      }
    }

    const start = options.startDate ? new Date(options.startDate) : new Date();
    let end = options.targetEndDate ? new Date(options.targetEndDate) : null;

    if (!end) {
      if (exams.length > 0) {
        // Nearest upcoming exam or max exam
        const sortedExams = [...exams].sort((a, b) => a.examDate.getTime() - b.examDate.getTime());
        end = sortedExams[sortedExams.length - 1].examDate;
      } else {
        // Default 30 days
        end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { topics, exams, start, end };
  }

  static async createCustomSession(userId, data) {
    let activePlan = await prisma.studyPlan.findFirst({
      where: { userId, isActive: true }
    });

    if (!activePlan) {
      activePlan = await prisma.studyPlan.create({
        data: {
          userId,
          title: 'Custom Academic Study Plan',
          startDate: new Date(),
          targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      });
    }

    const start = data.scheduledStart ? new Date(data.scheduledStart) : new Date();
    const duration = data.durationMinutes || 45;
    const end = data.scheduledEnd ? new Date(data.scheduledEnd) : new Date(start.getTime() + duration * 60 * 1000);

    return prisma.studySession.create({
      data: {
        studyPlanId: activePlan.id,
        topicId: data.topicId,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: duration,
        sessionType: data.sessionType || 'LEARN',
        status: 'PLANNED',
        notes: data.notes || null
      },
      include: {
        topic: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });
  }

  static async exportICS(userId, { planId } = {}) {
    const where = {
      studyPlan: { userId }
    };
    if (planId) {
      where.studyPlanId = planId;
    }

    const sessions = await prisma.studySession.findMany({
      where,
      include: {
        topic: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { scheduledStart: 'asc' }
    });

    const formatICSDate = (date) => {
      const d = new Date(date);
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeICS = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const now = formatICSDate(new Date());
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart Study Planner//Academic Schedule RFC5545//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Smart Study Planner Schedule',
      'X-WR-TIMEZONE:UTC'
    ];

    for (const session of sessions) {
      const start = formatICSDate(session.scheduledStart);
      const end = formatICSDate(session.scheduledEnd);
      const subjectName = session.topic?.unit?.subject?.name || 'Academic Study';
      const topicTitle = session.topic?.title || 'Study Session';
      const summary = `[${subjectName}] ${topicTitle} (${session.sessionType || 'STUDY'})`;
      const description = `Subject: ${subjectName}\\nTopic: ${topicTitle}\\nType: ${session.sessionType || 'LEARN'}\\nDuration: ${session.durationMinutes} mins\\nStatus: ${session.status}\\nSmart Study Planner`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:session-${session.id}@smartstudyplanner.academic`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
      lines.push(`SUMMARY:${escapeICS(summary)}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`STATUS:${session.status === 'COMPLETED' ? 'CONFIRMED' : 'TENTATIVE'}`);
      lines.push('TRANSP:OPAQUE');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
}
