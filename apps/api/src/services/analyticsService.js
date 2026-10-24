import { prisma } from '../db/prisma.js';
import { calculateExamReadiness, evaluateTopicMastery } from '@ai-study/domain';

export class AnalyticsService {
  static async getDashboardMetrics(userId) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // 1. User preferences & goals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true }
    });

    const dailyTargetMinutes = user?.preferences?.dailyStudyMinutesGoal || 120;

    // 2. Today's sessions
    const todaysSessions = await prisma.studySession.findMany({
      where: {
        studyPlan: { userId },
        scheduledStart: { gte: startOfToday, lte: endOfToday }
      },
      include: {
        topic: { include: { unit: { include: { subject: true } } } }
      },
      orderBy: { scheduledStart: 'asc' }
    });

    const completedTodayMinutes = todaysSessions
      .filter((s) => s.status === 'COMPLETED')
      .reduce((acc, s) => acc + (s.actualDurationMinutes || s.durationMinutes), 0);

    // 3. Upcoming examinations
    const upcomingExams = await prisma.examination.findMany({
      where: {
        subject: { userId, archived: false },
        examDate: { gte: startOfToday }
      },
      orderBy: { examDate: 'asc' },
      include: { subject: true },
      take: 3
    });

    // 4. Syllabus completion across subjects
    const subjects = await prisma.subject.findMany({
      where: { userId, archived: false },
      include: {
        units: {
          include: {
            topics: {
              include: {
                revisionRecords: { orderBy: { reviewDate: 'desc' } }
              }
            }
          }
        }
      }
    });

    let totalTopics = 0;
    let masteredTopics = 0;
    const subjectReadiness = [];

    for (const subj of subjects) {
      let subjTopics = 0;
      let subjMastered = 0;
      const evaluatedList = [];
      const weights = new Map();

      for (const unit of subj.units) {
        for (const t of unit.topics) {
          totalTopics++;
          subjTopics++;
          if (t.status === 'MASTERED') {
            masteredTopics++;
            subjMastered++;
          }

          const evaluated = evaluateTopicMastery({
            topicId: t.id,
            topicTitle: t.title,
            subjectId: subj.id,
            subjectName: subj.name,
            importance: t.importance,
            confidence: t.confidence,
            reviewRepetitions: t.revisionRecords.length
          });

          evaluatedList.push(evaluated);
          weights.set(t.id, t.importance);
        }
      }

      const readinessScore = calculateExamReadiness(evaluatedList, weights);
      subjectReadiness.push({
        subjectId: subj.id,
        subjectName: subj.name,
        colorToken: subj.colorToken,
        topicCount: subjTopics,
        masteredCount: subjMastered,
        readinessScore
      });
    }

    const syllabusCompletionPercent = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;

    // 5. Revision queue count
    const dueRevisionsCount = await prisma.topic.count({
      where: {
        unit: { subject: { userId, archived: false } },
        OR: [
          { nextRevisionDate: { lte: endOfToday } },
          { nextRevisionDate: null }
        ]
      }
    });

    return {
      dailyTargetMinutes,
      completedTodayMinutes,
      dailyAdherencePercent: Math.min(100, Math.round((completedTodayMinutes / dailyTargetMinutes) * 100)),
      syllabusCompletionPercent,
      totalTopics,
      masteredTopics,
      dueRevisionsCount,
      todaysSessions,
      upcomingExams: upcomingExams.map((ex) => {
        const diffMs = new Date(ex.examDate).getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        return {
          id: ex.id,
          title: ex.title,
          subjectName: ex.subject.name,
          colorToken: ex.subject.colorToken,
          examDate: ex.examDate,
          daysLeft
        };
      }),
      subjectReadiness
    };
  }
}
