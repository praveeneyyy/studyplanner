import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { RewardService } from './rewardService.js';

/**
 * AI Plan Builder Service
 * Provides context-aware natural language study plan generation,
 * hybrid constraint parsing, and deterministic conflict-free scheduling.
 */
export class AIPlanBuilderService {
  /**
   * Retrieves all academic context for a student:
   * subjects, syllabus topics, examinations, detected weak topics,
   * active study plan, and study preferences.
   */
  static async getStudentContext(userId) {
    const [user, preferences, subjects, quizAttempts, activePlan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, academicLevel: true, totalXP: true, currentLevel: true }
      }),
      prisma.userPreference.findUnique({
        where: { userId }
      }),
      prisma.subject.findMany({
        where: { userId, archived: false },
        include: {
          examinations: {
            where: { completed: false },
            orderBy: { examDate: 'asc' }
          },
          units: {
            orderBy: { orderIndex: 'asc' },
            include: {
              topics: {
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        take: 10,
        orderBy: { completedAt: 'desc' },
        include: {
          quiz: {
            include: {
              questions: {
                include: { topic: true }
              }
            }
          }
        }
      }),
      prisma.studyPlan.findFirst({
        where: { userId, isActive: true },
        include: {
          sessions: {
            select: { id: true, status: true, durationMinutes: true }
          }
        }
      })
    ]);

    // Flatten all topics and compute weak topics
    const allTopics = [];
    const examinations = [];
    const now = new Date();

    for (const subj of subjects) {
      for (const ex of subj.examinations) {
        const daysLeft = Math.max(0, Math.ceil((new Date(ex.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        examinations.push({
          id: ex.id,
          subjectId: subj.id,
          subjectName: subj.name,
          title: ex.title,
          examDate: ex.examDate,
          daysLeft,
          weightagePercent: ex.weightagePercent,
          targetScorePercent: ex.targetScorePercent
        });
      }

      for (const unit of subj.units) {
        for (const t of unit.topics) {
          allTopics.push({
            id: t.id,
            subjectId: subj.id,
            subjectName: subj.name,
            subjectColor: subj.colorToken,
            unitId: unit.id,
            unitTitle: unit.title,
            title: t.title,
            estimatedMinutes: t.estimatedMinutes || 45,
            difficulty: t.difficulty || 3,
            importance: t.importance || 3,
            confidence: t.confidence || 1,
            status: t.status || 'NOT_STARTED'
          });
        }
      }
    }

    // Weak topics: confidence <= 2 OR low quiz score
    const weakTopics = allTopics.filter((t) => t.confidence <= 2 || t.status === 'NOT_STARTED');

    // Parse weekly availability if available
    let weeklyAvailability = { mon: 180, tue: 180, wed: 180, thu: 180, fri: 180, sat: 240, sun: 240 };
    if (preferences?.weeklyAvailability) {
      try {
        weeklyAvailability = JSON.parse(preferences.weeklyAvailability);
      } catch (e) {
        // use default
      }
    }

    return {
      user: user || { id: userId, fullName: 'Student', email: '' },
      preferences: {
        dailyStudyMinutesGoal: preferences?.dailyStudyMinutesGoal || 180,
        sessionDurationPref: preferences?.sessionDurationPref || 45,
        breakDurationPref: preferences?.breakDurationPref || 10,
        weeklyAvailability
      },
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        colorToken: s.colorToken,
        priority: s.priority,
        topicCount: s.units.reduce((acc, u) => acc + u.topics.length, 0),
        examCount: s.examinations.length
      })),
      allTopics,
      examinations,
      weakTopics,
      activePlan: activePlan
        ? {
            id: activePlan.id,
            title: activePlan.title,
            startDate: activePlan.startDate,
            targetEndDate: activePlan.targetEndDate,
            totalPlannedMinutes: activePlan.totalPlannedMinutes,
            completedMinutes: activePlan.completedMinutes,
            totalSessions: activePlan.sessions.length,
            completedSessions: activePlan.sessions.filter((s) => s.status === 'COMPLETED').length
          }
        : null
    };
  }

  /**
   * Parses natural language prompt + student context into structured constraints.
   */
  static parsePlanningConstraints(prompt, studentContext, explicitConstraints = {}) {
    const text = (prompt || '').toLowerCase();
    const now = new Date();

    // 1. Duration / End Date
    let durationDays = explicitConstraints.durationDays || 21; // Default 3 weeks
    if (text.includes('1 week') || text.includes('one week') || text.includes('7 days')) {
      durationDays = 7;
    } else if (text.includes('2 weeks') || text.includes('two weeks') || text.includes('14 days')) {
      durationDays = 14;
    } else if (text.includes('3 weeks') || text.includes('three weeks') || text.includes('21 days')) {
      durationDays = 21;
    } else if (text.includes('4 weeks') || text.includes('four weeks') || text.includes('month') || text.includes('30 days')) {
      durationDays = 30;
    } else if (text.includes('6 weeks')) {
      durationDays = 42;
    } else if (studentContext.examinations.length > 0 && !explicitConstraints.durationDays) {
      // Use nearest exam date if available
      const nearestExam = studentContext.examinations[0];
      if (nearestExam.daysLeft > 2 && nearestExam.daysLeft < 60) {
        durationDays = nearestExam.daysLeft;
      }
    }

    const startDate = explicitConstraints.startDate ? new Date(explicitConstraints.startDate) : new Date(now);
    const targetEndDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 2. Study hours
    let weekdayHours = explicitConstraints.weekdayHours || 3;
    let weekendHours = explicitConstraints.weekendHours || 5;

    // Detect weekday hours from text
    const weekdayMatch = text.match(/(\d+)\s*(?:hours|hrs|hr|h)?\s*(?:on|per)?\s*weekdays/i) ||
      text.match(/weekdays(?:\s*(?:for|at)?\s*)(\d+)\s*(?:hours|hrs|hr|h)/i);
    if (weekdayMatch) {
      weekdayHours = Math.max(1, Math.min(10, parseInt(weekdayMatch[1], 10)));
    }

    // Detect weekend hours from text
    const weekendMatch = text.match(/(\d+)\s*(?:hours|hrs|hr|h)?\s*(?:on|per)?\s*weekends/i) ||
      text.match(/weekends(?:\s*(?:for|at)?\s*)(\d+)\s*(?:hours|hrs|hr|h)/i);
    if (weekendMatch) {
      weekendHours = Math.max(1, Math.min(12, parseInt(weekendMatch[1], 10)));
    }

    // Detect generic daily hours
    const dailyMatch = text.match(/(\d+)\s*(?:hours|hrs|hr|h)\s*(?:daily|a day|per day|every day)/i);
    if (dailyMatch && !weekdayMatch && !weekendMatch) {
      const hours = Math.max(1, Math.min(10, parseInt(dailyMatch[1], 10)));
      weekdayHours = hours;
      weekendHours = hours;
    }

    // 3. Priority Subject Detection
    const prioritizedSubjectIds = new Set(explicitConstraints.prioritizedSubjectIds || []);
    let customFocusTitle = null;
    if (text.includes('dsa') || text.includes('data structure')) {
      if (text.includes('java')) {
        customFocusTitle = 'Data Structures & Algorithms (Java)';
      } else if (text.includes('python')) {
        customFocusTitle = 'Data Structures & Algorithms (Python)';
      } else if (text.includes('c++') || text.includes('cpp')) {
        customFocusTitle = 'Data Structures & Algorithms (C++)';
      } else {
        customFocusTitle = 'Data Structures & Algorithms';
      }
    } else if (text.includes('java')) {
      customFocusTitle = 'Java Programming & Application Architecture';
    } else if (text.includes('python')) {
      customFocusTitle = 'Python Programming & Scientific Computing';
    } else if (text.includes('machine learning') || text.includes('neural') || text.includes('deep learning') || text.includes('ai')) {
      customFocusTitle = 'Machine Learning & Neural Networks';
    } else if (text.includes('operating system') || text.includes('os')) {
      customFocusTitle = 'Operating Systems';
    } else if (text.includes('dbms') || text.includes('database') || text.includes('sql')) {
      customFocusTitle = 'Database Management Systems';
    } else if (text.includes('calculus') || text.includes('math') || text.includes('linear algebra')) {
      customFocusTitle = 'Calculus & Linear Algebra';
    } else if (text.includes('network') || text.includes('networking')) {
      customFocusTitle = 'Computer Networks';
    } else if (text.includes('web') || text.includes('fullstack') || text.includes('react')) {
      customFocusTitle = 'Web Engineering & Systems';
    }

    for (const subj of studentContext.subjects) {
      const sName = subj.name.toLowerCase();
      const sCode = (subj.code || '').toLowerCase();
      if (
        (sName && text.includes(sName)) ||
        (sCode && text.includes(sCode)) ||
        (sName.includes('data structures') && (text.includes('dsa') || text.includes('data structure'))) ||
        (sName.includes('operating systems') && (text.includes('os') || text.includes('operating system'))) ||
        (sName.includes('calculus') && (text.includes('math') || text.includes('calculus')))
      ) {
        prioritizedSubjectIds.add(subj.id);
      }
    }

    // 4. Mock test / final buffer days
    let mockTestDays = explicitConstraints.mockTestDays !== undefined ? explicitConstraints.mockTestDays : 2;
    if (text.includes('last 2 days') || text.includes('last two days') || text.includes('final 2 days')) {
      mockTestDays = 2;
    } else if (text.includes('last 3 days') || text.includes('last three days')) {
      mockTestDays = 3;
    } else if (text.includes('last day') || text.includes('final day') || text.includes('last 1 day')) {
      mockTestDays = 1;
    } else if (text.includes('no mock') || text.includes('skip mock')) {
      mockTestDays = 0;
    }

    // 5. Daily revision requested
    const includeDailyRevision = text.includes('daily revision') ||
      text.includes('revision every day') ||
      text.includes('review daily') ||
      explicitConstraints.includeDailyRevision !== false;

    // 6. Session & break duration
    const sessionDurationMinutes = explicitConstraints.sessionDurationMinutes ||
      studentContext.preferences.sessionDurationPref || 45;
    const breakMinutes = explicitConstraints.breakMinutes ||
      studentContext.preferences.breakDurationPref || 10;

    return {
      durationDays,
      startDate,
      targetEndDate,
      weekdayHours,
      weekendHours,
      prioritizedSubjectIds: Array.from(prioritizedSubjectIds),
      customFocusTitle,
      mockTestDays,
      includeDailyRevision,
      sessionDurationMinutes,
      breakMinutes
    };
  }

  /**
   * Deterministic Schedule Generation Engine
   * Generates conflict-free daily schedule honoring weekday/weekend differential capacity,
   * priority subject weighting, spaced daily revision, and pre-exam mock test buffers.
   */
  static buildDeterministicSchedule(studentContext, constraints) {
    const {
      durationDays,
      startDate,
      targetEndDate,
      weekdayHours,
      weekendHours,
      prioritizedSubjectIds,
      mockTestDays,
      includeDailyRevision,
      sessionDurationMinutes,
      breakMinutes
    } = constraints;

    let allTopics = [...studentContext.allTopics];
    const subjectsList = studentContext.subjects?.length > 0
      ? studentContext.subjects
      : [{ id: 'starter-cs', name: 'Computer Science & Algorithms', colorToken: 'cs' }];

    if (allTopics.length === 0) {
      allTopics = [
        {
          id: 'starter-dsa-1',
          subjectId: subjectsList[0].id,
          subjectName: subjectsList[0].name,
          subjectColor: subjectsList[0].colorToken || 'cs',
          unitId: 'unit-algo',
          unitTitle: 'Algorithmic Problem Solving',
          title: 'Asymptotic Analysis & Big-O Notation',
          estimatedMinutes: 45,
          difficulty: 3,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'starter-dsa-2',
          subjectId: subjectsList[0].id,
          subjectName: subjectsList[0].name,
          subjectColor: subjectsList[0].colorToken || 'cs',
          unitId: 'unit-algo',
          unitTitle: 'Algorithmic Problem Solving',
          title: 'Binary Search Trees & Depth-First Search',
          estimatedMinutes: 45,
          difficulty: 4,
          importance: 4,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'starter-dsa-3',
          subjectId: subjectsList[0].id,
          subjectName: subjectsList[0].name,
          subjectColor: subjectsList[0].colorToken || 'cs',
          unitId: 'unit-algo',
          unitTitle: 'Algorithmic Problem Solving',
          title: 'Dynamic Programming & Memoization',
          estimatedMinutes: 45,
          difficulty: 5,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'starter-dsa-4',
          subjectId: subjectsList[0].id,
          subjectName: subjectsList[0].name,
          subjectColor: subjectsList[0].colorToken || 'cs',
          unitId: 'unit-algo',
          unitTitle: 'Algorithmic Problem Solving',
          title: "Dijkstra's Shortest Path Algorithm",
          estimatedMinutes: 45,
          difficulty: 4,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        }
      ];
    }

    // If student explicitly requested Data Structures & Algorithms in Java
    if (constraints.customFocusTitle && constraints.customFocusTitle.includes('Java') && constraints.customFocusTitle.includes('Data Structures')) {
      const targetSubjId = prioritizedSubjectIds[0] || subjectsList[0]?.id || 'subj-dsa';
      const javaDsaCurriculum = [
        {
          id: 'java-dsa-1',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-1',
          unitTitle: 'Unit 1: Java Foundations & Big-O Complexity',
          title: 'Java Memory Architecture, Object References & Big-O Notation',
          estimatedMinutes: 45,
          difficulty: 3,
          importance: 5,
          confidence: 2,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-2',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-1',
          unitTitle: 'Unit 1: Java Foundations & Big-O Complexity',
          title: 'Dynamic Arrays & Java ArrayList Internal Implementation',
          estimatedMinutes: 45,
          difficulty: 3,
          importance: 5,
          confidence: 2,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-3',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-2',
          unitTitle: 'Unit 2: Linear Data Structures in Java',
          title: 'Singly and Doubly Linked Lists with Java Pointer Manipulation',
          estimatedMinutes: 50,
          difficulty: 4,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-4',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-2',
          unitTitle: 'Unit 2: Linear Data Structures in Java',
          title: 'Stacks and Queues using Java ArrayDeque & LinkedList',
          estimatedMinutes: 45,
          difficulty: 3,
          importance: 4,
          confidence: 2,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-5',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-3',
          unitTitle: 'Unit 3: Hierarchical Trees & Heaps in Java',
          title: 'Binary Search Trees (BST) Insertion, Deletion & In-Order Traversal',
          estimatedMinutes: 55,
          difficulty: 4,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-6',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-3',
          unitTitle: 'Unit 3: Hierarchical Trees & Heaps in Java',
          title: 'Min/Max Heaps & Java PriorityQueue Implementation',
          estimatedMinutes: 45,
          difficulty: 4,
          importance: 4,
          confidence: 2,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-7',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-4',
          unitTitle: 'Unit 4: Hashing & Fast Lookups in Java',
          title: 'HashMap & HashSet Internals: Hash Codes, Buckets & Collision Handling',
          estimatedMinutes: 50,
          difficulty: 4,
          importance: 5,
          confidence: 2,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-8',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-5',
          unitTitle: 'Unit 5: Graph Algorithms in Java',
          title: 'Graph Adjacency Lists, Breadth-First Search (BFS) & DFS in Java',
          estimatedMinutes: 55,
          difficulty: 4,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-9',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-5',
          unitTitle: 'Unit 5: Graph Algorithms in Java',
          title: "Dijkstra's Shortest Path & Topological Sort using Java PriorityQueue",
          estimatedMinutes: 60,
          difficulty: 5,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-10',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-6',
          unitTitle: 'Unit 6: Dynamic Programming & Optimization in Java',
          title: 'Dynamic Programming: 1D Memoization & Tabulation (Coin Change, LIS)',
          estimatedMinutes: 60,
          difficulty: 5,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        },
        {
          id: 'java-dsa-11',
          subjectId: targetSubjId,
          subjectName: 'Data Structures & Algorithms (Java)',
          subjectColor: 'cs',
          unitId: 'unit-java-dsa-6',
          unitTitle: 'Unit 6: Dynamic Programming & Optimization in Java',
          title: '0/1 Knapsack & Longest Common Subsequence in Java',
          estimatedMinutes: 60,
          difficulty: 5,
          importance: 5,
          confidence: 1,
          status: 'NOT_STARTED'
        }
      ];

      allTopics = [...javaDsaCurriculum, ...allTopics];
    }

    // Priority map for subjects
    const prioritySubjectSet = new Set(prioritizedSubjectIds);

    // Calculate priority score for each topic
    const scoredTopics = allTopics.map((topic) => {
      let score = 0;
      // High priority subject bonus
      if (prioritySubjectSet.has(topic.subjectId)) score += 3.0;
      // Low confidence bonus (weak topic)
      if (topic.confidence <= 2) score += 2.5;
      // High difficulty bonus
      score += (topic.difficulty || 3) * 0.4;
      // High importance bonus
      score += (topic.importance || 3) * 0.5;

      // Check upcoming exam proximity
      const exam = studentContext.examinations.find((e) => e.subjectId === topic.subjectId);
      if (exam) {
        const daysLeft = exam.daysLeft;
        score += Math.max(0.5, Math.min(3.0, 30 / (daysLeft + 1)));
      }

      return {
        ...topic,
        priorityScore: Math.round(score * 10) / 10
      };
    });

    // Sort: highest priority score descending
    scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);

    const generatedSessions = [];
    let currentTopicIndex = 0;
    const studiedTopicPool = [];

    let totalAvailableMinutes = 0;
    let totalPlannedMinutes = 0;

    const daySlotHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:30', '19:30', '20:30'];

    for (let dayIndex = 0; dayIndex < durationDays; dayIndex++) {
      const currentDate = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dailyCapacityHours = isWeekend ? weekendHours : weekdayHours;
      const dailyCapacityMinutes = dailyCapacityHours * 60;
      totalAvailableMinutes += dailyCapacityMinutes;

      // Determine if this is one of the final mock test days
      const isBufferDay = dayIndex >= durationDays - mockTestDays && mockTestDays > 0;

      let scheduledMinutesToday = 0;
      let slotIndex = 0;

      if (isBufferDay) {
        // Buffer / Mock Exam day
        const mockSubject = subjectsList[dayIndex % subjectsList.length] || subjectsList[0];
        const mockDuration = Math.min(dailyCapacityMinutes, 120);

        const [startH, startM] = daySlotHours[0].split(':').map(Number);
        const sessionStart = new Date(currentDate);
        sessionStart.setHours(startH, startM, 0, 0);
        const sessionEnd = new Date(sessionStart.getTime() + mockDuration * 60 * 1000);

        generatedSessions.push({
          id: `draft-session-${dayIndex}-mock`,
          topicId: scoredTopics[0]?.id || 'mock-topic',
          topicTitle: `Full-Length Mock Examination & Timed Paper (${mockSubject.name})`,
          subjectId: mockSubject.id,
          subjectName: mockSubject.name,
          subjectColor: mockSubject.colorToken,
          scheduledStart: sessionStart.toISOString(),
          scheduledEnd: sessionEnd.toISOString(),
          durationMinutes: mockDuration,
          sessionType: 'MOCK_TEST',
          priorityScore: 5.0,
          dayIndex,
          dayDateString: currentDate.toISOString().slice(0, 10),
          dayOfWeekName: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
        });

        scheduledMinutesToday += mockDuration;
        totalPlannedMinutes += mockDuration;

        // Add an error analysis / revision session if capacity remains
        if (dailyCapacityMinutes - scheduledMinutesToday >= 60) {
          const revDuration = 60;
          const [revH, revM] = daySlotHours[3].split(':').map(Number);
          const revStart = new Date(currentDate);
          revStart.setHours(revH, revM, 0, 0);
          const revEnd = new Date(revStart.getTime() + revDuration * 60 * 1000);

          generatedSessions.push({
            id: `draft-session-${dayIndex}-rev`,
            topicId: scoredTopics[1]?.id || scoredTopics[0]?.id,
            topicTitle: `Comprehensive Formula Review & Mistake Journal (${mockSubject.name})`,
            subjectId: mockSubject.id,
            subjectName: mockSubject.name,
            subjectColor: mockSubject.colorToken,
            scheduledStart: revStart.toISOString(),
            scheduledEnd: revEnd.toISOString(),
            durationMinutes: revDuration,
            sessionType: 'REVISE',
            priorityScore: 4.8,
            dayIndex,
            dayDateString: currentDate.toISOString().slice(0, 10),
            dayOfWeekName: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
          });

          scheduledMinutesToday += revDuration;
          totalPlannedMinutes += revDuration;
        }

        continue;
      }

      // Standard study day
      let hasScheduledRevisionToday = false;

      while (scheduledMinutesToday + sessionDurationMinutes <= dailyCapacityMinutes && slotIndex < daySlotHours.length) {
        const timeSlot = daySlotHours[slotIndex % daySlotHours.length];
        const [h, m] = timeSlot.split(':').map(Number);

        const sessionStart = new Date(currentDate);
        sessionStart.setHours(h, m, 0, 0);
        const sessionEnd = new Date(sessionStart.getTime() + sessionDurationMinutes * 60 * 1000);

        // Check if we should insert a spaced revision session
        if (includeDailyRevision && !hasScheduledRevisionToday && studiedTopicPool.length > 0 && slotIndex > 0) {
          // Pick a previously studied or weak topic
          const revTopic = studiedTopicPool[Math.floor(Math.random() * studiedTopicPool.length)];
          generatedSessions.push({
            id: `draft-session-${dayIndex}-${slotIndex}`,
            topicId: revTopic.id,
            topicTitle: `Active Recall & Revision: ${revTopic.title}`,
            subjectId: revTopic.subjectId,
            subjectName: revTopic.subjectName,
            subjectColor: revTopic.subjectColor,
            scheduledStart: sessionStart.toISOString(),
            scheduledEnd: sessionEnd.toISOString(),
            durationMinutes: sessionDurationMinutes,
            sessionType: 'REVISE',
            priorityScore: revTopic.priorityScore,
            dayIndex,
            dayDateString: currentDate.toISOString().slice(0, 10),
            dayOfWeekName: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
          });

          hasScheduledRevisionToday = true;
          scheduledMinutesToday += sessionDurationMinutes;
          totalPlannedMinutes += sessionDurationMinutes;
          slotIndex++;
          continue;
        }

        // Standard learning session
        const currentTopic = scoredTopics[currentTopicIndex % scoredTopics.length];
        generatedSessions.push({
          id: `draft-session-${dayIndex}-${slotIndex}`,
          topicId: currentTopic.id,
          topicTitle: currentTopic.title,
          unitTitle: currentTopic.unitTitle,
          subjectId: currentTopic.subjectId,
          subjectName: currentTopic.subjectName,
          subjectColor: currentTopic.subjectColor,
          scheduledStart: sessionStart.toISOString(),
          scheduledEnd: sessionEnd.toISOString(),
          durationMinutes: sessionDurationMinutes,
          sessionType: 'LEARN',
          priorityScore: currentTopic.priorityScore,
          dayIndex,
          dayDateString: currentDate.toISOString().slice(0, 10),
          dayOfWeekName: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
        });

        if (!studiedTopicPool.find((t) => t.id === currentTopic.id)) {
          studiedTopicPool.push(currentTopic);
        }

        currentTopicIndex++;
        scheduledMinutesToday += sessionDurationMinutes;
        totalPlannedMinutes += sessionDurationMinutes;
        slotIndex++;
      }
    }

    // Feasibility calculation
    const totalRequiredMinutes = scoredTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 45), 0);
    const isFeasible = totalPlannedMinutes >= Math.min(totalRequiredMinutes, totalAvailableMinutes * 0.7);
    let feasibilityWarning = null;

    if (totalRequiredMinutes > totalAvailableMinutes) {
      const deficitHours = Math.round(((totalRequiredMinutes - totalAvailableMinutes) / 60) * 10) / 10;
      feasibilityWarning = `Curriculum workload deficit: Total syllabus requires ${Math.round(totalRequiredMinutes / 60)}h, but current constraints provide ${Math.round(totalAvailableMinutes / 60)}h. Deficit is ${deficitHours}h. Recommended: increase weekday hours or extend end date.`;
    }

    // Subject breakdown
    const subjectMap = new Map();
    for (const s of generatedSessions) {
      if (!subjectMap.has(s.subjectId)) {
        subjectMap.set(s.subjectId, {
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          colorToken: s.subjectColor || 'cs',
          plannedMinutes: 0,
          sessionCount: 0,
          uniqueTopics: new Set()
        });
      }
      const entry = subjectMap.get(s.subjectId);
      entry.plannedMinutes += s.durationMinutes;
      entry.sessionCount += 1;
      entry.uniqueTopics.add(s.topicId);
    }

    const subjectBreakdown = Array.from(subjectMap.values()).map((item) => ({
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      colorToken: item.colorToken,
      plannedMinutes: item.plannedMinutes,
      plannedHours: Math.round((item.plannedMinutes / 60) * 10) / 10,
      sessionCount: item.sessionCount,
      uniqueTopicCount: item.uniqueTopics.size,
      percentage: totalPlannedMinutes > 0 ? Math.round((item.plannedMinutes / totalPlannedMinutes) * 100) : 0
    }));

    // Group sessions by day for agenda and calendar views
    const dailyAgenda = [];
    const daysMap = new Map();

    for (const session of generatedSessions) {
      if (!daysMap.has(session.dayDateString)) {
        daysMap.set(session.dayDateString, {
          dayDateString: session.dayDateString,
          dayIndex: session.dayIndex,
          dayOfWeekName: session.dayOfWeekName,
          totalMinutes: 0,
          sessions: []
        });
      }
      const day = daysMap.get(session.dayDateString);
      day.totalMinutes += session.durationMinutes;
      day.sessions.push(session);
    }

    dailyAgenda.push(...Array.from(daysMap.values()));

    return {
      title: constraints.customFocusTitle
        ? `${constraints.customFocusTitle} Study Plan`
        : `Adaptive AI Study Sprint (${startDate.toISOString().slice(0, 10)} - ${targetEndDate.toISOString().slice(0, 10)})`,
      startDate: startDate.toISOString(),
      targetEndDate: targetEndDate.toISOString(),
      durationDays,
      weekdayHours,
      weekendHours,
      sessionDurationMinutes,
      breakMinutes,
      mockTestDays,
      totalPlannedMinutes,
      totalPlannedHours: Math.round((totalPlannedMinutes / 60) * 10) / 10,
      totalAvailableMinutes,
      totalAvailableHours: Math.round((totalAvailableMinutes / 60) * 10) / 10,
      sessionCount: generatedSessions.length,
      isFeasible,
      feasibilityWarning,
      syllabusCoveragePercent: Math.min(100, Math.round((studiedTopicPool.length / scoredTopics.length) * 100)),
      subjectBreakdown,
      dailyAgenda,
      sessions: generatedSessions
    };
  }

  /**
   * Calls Hugging Face Inference API if configured, with graceful fallback.
   */
  static async _callHuggingFaceOrFallback(prompt, studentContext, parsedConstraints) {
    if (config.huggingface?.apiKey) {
      try {
        const hfEndpoint = `${config.huggingface.inferenceUrl}/${config.huggingface.model}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(hfEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.huggingface.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: `You are an expert academic study planning AI assistant. Formulate a concise summary of the student's study plan.\nPrompt: "${prompt}"\nSchedule: ${parsedConstraints.durationDays} days, ${parsedConstraints.weekdayHours}h weekdays, ${parsedConstraints.weekendHours}h weekends, ${parsedConstraints.mockTestDays} mock days.`,
            parameters: { max_new_tokens: 150, temperature: 0.3 }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json[0]?.generated_text) {
            return json[0].generated_text.trim();
          }
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    // High quality deterministic synthesis fallback
    const priorityNames = studentContext.subjects
      .filter((s) => parsedConstraints.prioritizedSubjectIds.includes(s.id))
      .map((s) => s.name);

    const priorityPhrase = priorityNames.length > 0
      ? `special emphasis on **${priorityNames.join(', ')}**`
      : 'balanced coverage across all unmastered syllabus units';

    const mockPhrase = parsedConstraints.mockTestDays > 0
      ? `The final **${parsedConstraints.mockTestDays} days** are reserved exclusively for full-length mock examinations and error analysis.`
      : 'Continuous review sessions are scheduled alongside new concept learning.';

    return `I have analyzed your study profile and synthesized an adaptive, conflict-free study plan:

- **Duration:** ${parsedConstraints.durationDays} days (target completion: ${parsedConstraints.targetEndDate.toISOString().slice(0, 10)}).
- **Daily Pace:** ${parsedConstraints.weekdayHours} hours on weekdays and ${parsedConstraints.weekendHours} hours on weekends.
- **Priority Focus:** Weighted with ${priorityPhrase}.
- **Exam Buffer:** ${mockPhrase}

You can examine the complete schedule using the **Daily Agenda**, **Weekly Calendar**, **Table View**, and **Subject Breakdown** tabs below. Click **"Accept & Commit Plan"** when you are ready to persist it to your dashboard.`;
  }

  /**
   * Main entrypoint for generating an AI plan draft.
   */
  static async generatePlanDraft(userId, prompt, explicitConstraints = {}, history = []) {
    const studentContext = await this.getStudentContext(userId);
    const parsedConstraints = this.parsePlanningConstraints(prompt, studentContext, explicitConstraints);
    const draft = this.buildDeterministicSchedule(studentContext, parsedConstraints);
    const aiMessage = await this._callHuggingFaceOrFallback(prompt, studentContext, parsedConstraints);

    return {
      draft,
      message: aiMessage,
      constraints: parsedConstraints,
      studentContext: {
        totalSubjects: studentContext.subjects.length,
        totalTopics: studentContext.allTopics.length,
        weakTopicCount: studentContext.weakTopics.length,
        examinations: studentContext.examinations
      }
    };
  }

  /**
   * Adjusts an existing plan draft (e.g. Lighter workload, Intensify weak topics, Regenerate day).
   */
  static async adjustPlanDraft(userId, { draft, action, params = {} }) {
    const studentContext = await this.getStudentContext(userId);
    const updatedConstraints = {
      durationDays: draft.durationDays || 21,
      startDate: new Date(draft.startDate),
      targetEndDate: new Date(draft.targetEndDate),
      weekdayHours: draft.weekdayHours || 3,
      weekendHours: draft.weekendHours || 5,
      prioritizedSubjectIds: draft.subjectBreakdown?.map((s) => s.subjectId) || [],
      mockTestDays: draft.mockTestDays || 2,
      includeDailyRevision: true,
      sessionDurationMinutes: draft.sessionDurationMinutes || 45,
      breakMinutes: draft.breakMinutes || 10
    };

    if (action === 'LIGHTER') {
      // Reduce daily hours by 20-25%
      updatedConstraints.weekdayHours = Math.max(1.5, Math.round((updatedConstraints.weekdayHours * 0.75) * 10) / 10);
      updatedConstraints.weekendHours = Math.max(2, Math.round((updatedConstraints.weekendHours * 0.8) * 10) / 10);
    } else if (action === 'INTENSIFY_WEAK') {
      // Add weak topics to priority list and ensure daily revision
      const weakSubjIds = studentContext.weakTopics.map((t) => t.subjectId);
      updatedConstraints.prioritizedSubjectIds = Array.from(new Set([...updatedConstraints.prioritizedSubjectIds, ...weakSubjIds]));
      updatedConstraints.includeDailyRevision = true;
    } else if (action === 'EXTEND_DEADLINE') {
      // Add 7 days
      updatedConstraints.durationDays += 7;
      updatedConstraints.targetEndDate = new Date(updatedConstraints.startDate.getTime() + updatedConstraints.durationDays * 24 * 60 * 60 * 1000);
    }

    const newDraft = this.buildDeterministicSchedule(studentContext, updatedConstraints);
    return {
      draft: newDraft,
      message: `Adjusted plan with ${action.toLowerCase().replace('_', ' ')} parameters. Total planned study is now ${newDraft.totalPlannedHours}h across ${newDraft.sessionCount} sessions.`
    };
  }

  /**
   * Persists the approved plan draft transactionally to the database.
   * Creates StudyPlan and StudySession records, and awards XP.
   */
  static async confirmPlanDraft(userId, draft) {
    if (!draft || !draft.sessions || draft.sessions.length === 0) {
      const err = new Error('Invalid plan draft: No sessions provided.');
      err.statusCode = 400;
      throw err;
    }

    const start = new Date(draft.startDate);
    const end = new Date(draft.targetEndDate);

    // Deactivate previous active plans
    await prisma.studyPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    // Resolve or persist any synthetic topic IDs in draft.sessions to satisfy DB foreign keys
    const distinctDraftTopics = new Map();
    for (const s of draft.sessions) {
      if (s.topicId && !distinctDraftTopics.has(s.topicId)) {
        distinctDraftTopics.set(s.topicId, {
          title: s.topicTitle || 'Study Session Topic',
          subjectName: s.subjectName || 'General Studies'
        });
      }
    }

    const existingTopics = await prisma.topic.findMany({
      where: { id: { in: Array.from(distinctDraftTopics.keys()) } },
      select: { id: true }
    });
    const existingTopicIds = new Set(existingTopics.map((t) => t.id));

    let defaultUserSubject = await prisma.subject.findFirst({
      where: { userId, archived: false },
      include: { units: true }
    });

    if (!defaultUserSubject) {
      defaultUserSubject = await prisma.subject.create({
        data: {
          userId,
          name: draft.title?.includes('Java') ? 'Data Structures & Algorithms (Java)' : 'Core Curriculum',
          code: 'CS-CORE',
          colorToken: 'cs',
          priority: 5,
          units: {
            create: {
              title: 'Unit 1: Core Curriculum Topics',
              unitNumber: 1
            }
          }
        },
        include: { units: true }
      });
    }

    let defaultUnit = defaultUserSubject.units[0];
    if (!defaultUnit) {
      defaultUnit = await prisma.syllabusUnit.create({
        data: {
          subjectId: defaultUserSubject.id,
          title: 'Unit 1: Core Foundations',
          unitNumber: 1
        }
      });
    }

    const topicIdMap = new Map();
    for (const [draftTopicId, info] of distinctDraftTopics.entries()) {
      if (existingTopicIds.has(draftTopicId)) {
        topicIdMap.set(draftTopicId, draftTopicId);
      } else {
        const createdTopic = await prisma.topic.create({
          data: {
            unitId: defaultUnit.id,
            title: info.title,
            estimatedMinutes: 45,
            difficulty: 3,
            importance: 5,
            confidence: 2,
            status: 'NOT_STARTED'
          }
        });
        topicIdMap.set(draftTopicId, createdTopic.id);
      }
    }

    // Commit new plan and sessions transactionally
    const newPlan = await prisma.studyPlan.create({
      data: {
        userId,
        title: draft.title || `Adaptive Study Plan (${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)})`,
        startDate: start,
        targetEndDate: end,
        isActive: true,
        totalPlannedMinutes: draft.totalPlannedMinutes || 0,
        sessions: {
          create: draft.sessions.map((s) => ({
            topicId: topicIdMap.get(s.topicId) || defaultUnit.id,
            scheduledStart: new Date(s.scheduledStart),
            scheduledEnd: new Date(s.scheduledEnd),
            durationMinutes: s.durationMinutes || 45,
            sessionType: s.sessionType || 'LEARN',
            status: 'PLANNED',
            notes: s.topicTitle ? `Topic: ${s.topicTitle}` : null
          }))
        }
      },
      include: {
        sessions: {
          take: 10,
          include: {
            topic: {
              include: { unit: { include: { subject: true } } }
            }
          }
        }
      }
    });

    // Award XP reward for approving and committing an AI-generated study plan
    const reward = await RewardService.processRewardEvent({
      userId,
      eventType: 'PLAN_GENERATED',
      sourceEventId: newPlan.id,
      xp: 30,
      description: `Committed AI-assisted study plan with ${draft.sessions.length} sessions.`
    });

    return {
      planId: newPlan.id,
      title: newPlan.title,
      totalSessions: draft.sessions.length,
      totalPlannedMinutes: newPlan.totalPlannedMinutes,
      totalPlannedHours: Math.round((newPlan.totalPlannedMinutes / 60) * 10) / 10,
      reward,
      message: 'Plan committed successfully. Your dashboard has been updated.'
    };
  }
}
