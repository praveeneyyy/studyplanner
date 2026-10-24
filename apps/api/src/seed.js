import bcrypt from 'bcrypt';
import { prisma } from './db/prisma.js';

async function seed() {
  console.log('--- Starting Database Seeding ---');

  // 1. Seed Achievement Definitions
  const achievements = [
    {
      id: 'ach_first_session',
      title: 'First Step',
      description: 'Completed your first verified study session.',
      badgeIcon: 'Compass',
      category: 'DISCIPLINE',
      xpReward: 25,
      requiredMetric: 'completed_sessions >= 1'
    },
    {
      id: 'ach_quiz_novice',
      title: 'Fact Checker',
      description: 'Completed your first topical micro-quiz.',
      badgeIcon: 'CheckCircle2',
      category: 'MASTERY',
      xpReward: 20,
      requiredMetric: 'completed_quizzes >= 1'
    },
    {
      id: 'ach_quiz_ace',
      title: 'Perfect Recall',
      description: 'Scored 100% on any generated quiz.',
      badgeIcon: 'Award',
      category: 'MASTERY',
      xpReward: 40,
      requiredMetric: 'quiz_score == 100'
    },
    {
      id: 'ach_topic_master',
      title: 'Concept Master',
      description: 'Brought a syllabus topic to 100% mastery.',
      badgeIcon: 'Crown',
      category: 'MASTERY',
      xpReward: 30,
      requiredMetric: 'topic_mastered >= 1'
    },
    {
      id: 'ach_streak_3',
      title: 'Habit Forming',
      description: 'Maintained a 3-day active study streak.',
      badgeIcon: 'Flame',
      category: 'STREAK',
      xpReward: 35,
      requiredMetric: 'streak >= 3'
    },
    {
      id: 'ach_streak_7',
      title: 'Weekly Momentum',
      description: 'Maintained a 7-day active study streak.',
      badgeIcon: 'Zap',
      category: 'STREAK',
      xpReward: 75,
      requiredMetric: 'streak >= 7'
    },
    {
      id: 'ach_revision_champ',
      title: 'Memory Architect',
      description: 'Completed 10 spaced repetition reviews.',
      badgeIcon: 'Brain',
      category: 'DISCIPLINE',
      xpReward: 50,
      requiredMetric: 'completed_revisions >= 10'
    },
    {
      id: 'ach_deep_focus',
      title: 'Deep Diver',
      description: 'Completed a 60-minute deep work block.',
      badgeIcon: 'Target',
      category: 'DISCIPLINE',
      xpReward: 30,
      requiredMetric: 'session_duration >= 60'
    }
  ];

  for (const ach of achievements) {
    await prisma.achievementDefinition.upsert({
      where: { id: ach.id },
      update: ach,
      create: ach
    });
  }
  console.log(`Seeded ${achievements.length} achievement definitions.`);

  // 2. Remove old predefined user (alex@university.edu) if present
  const oldUser = await prisma.user.findUnique({ where: { email: 'alex@university.edu' } });
  if (oldUser) {
    console.log('Removing old predefined user: alex@university.edu');
    await prisma.rewardLedgerEntry.deleteMany({ where: { userId: oldUser.id } });
    await prisma.userStreak.deleteMany({ where: { userId: oldUser.id } });
    await prisma.weeklyGoal.deleteMany({ where: { userId: oldUser.id } });
    await prisma.userAchievement.deleteMany({ where: { userId: oldUser.id } });
    await prisma.notificationRecord.deleteMany({ where: { userId: oldUser.id } });
    await prisma.aIUsageRecord.deleteMany({ where: { userId: oldUser.id } });
    await prisma.aIConversation.deleteMany({ where: { userId: oldUser.id } });
    await prisma.quizAttempt.deleteMany({ where: { userId: oldUser.id } });
    await prisma.studySession.deleteMany({ where: { studyPlan: { userId: oldUser.id } } });
    await prisma.studyPlan.deleteMany({ where: { userId: oldUser.id } });
    await prisma.note.deleteMany({ where: { userId: oldUser.id } });
    await prisma.flashcard.deleteMany({ where: { userId: oldUser.id } });
    await prisma.subject.deleteMany({ where: { userId: oldUser.id } });
    await prisma.userPreference.deleteMany({ where: { userId: oldUser.id } });
    await prisma.notificationPreference.deleteMany({ where: { userId: oldUser.id } });
    await prisma.user.delete({ where: { id: oldUser.id } });
  }

  // 3. User Seed Function
  async function seedUserWithCurriculum({ email, password, fullName, academicLevel, subjects }) {
    let user = await prisma.user.findUnique({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 10);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          academicLevel,
          institution: 'Institute of Technology',
          totalXP: 320,
          currentLevel: 2,
          preferences: {
            create: {
              theme: 'system',
              timezone: 'UTC',
              dailyStudyMinutesGoal: 150,
              sessionDurationPref: 45,
              breakDurationPref: 10
            }
          },
          notificationPref: {
            create: {}
          }
        }
      });
      console.log(`Created student user: ${fullName} (${email} / password: ${password})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          fullName,
          academicLevel,
          totalXP: 320,
          currentLevel: 2
        }
      });
      console.log(`Updated student user: ${fullName} (${email} / password: ${password})`);
    }

    // Clean existing study data for user
    await prisma.rewardLedgerEntry.deleteMany({ where: { userId: user.id } });
    await prisma.userStreak.deleteMany({ where: { userId: user.id } });
    await prisma.weeklyGoal.deleteMany({ where: { userId: user.id } });
    await prisma.userAchievement.deleteMany({ where: { userId: user.id } });
    await prisma.notificationRecord.deleteMany({ where: { userId: user.id } });
    await prisma.aIUsageRecord.deleteMany({ where: { userId: user.id } });
    await prisma.aIConversation.deleteMany({ where: { userId: user.id } });
    await prisma.quizAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.studySession.deleteMany({ where: { studyPlan: { userId: user.id } } });
    await prisma.studyPlan.deleteMany({ where: { userId: user.id } });
    await prisma.note.deleteMany({ where: { userId: user.id } });
    await prisma.flashcard.deleteMany({ where: { userId: user.id } });
    await prisma.subject.deleteMany({ where: { userId: user.id } });

    const now = new Date();
    const createdSubjects = [];

    // Create Subjects and Units
    for (const sub of subjects) {
      const createdSub = await prisma.subject.create({
        data: {
          userId: user.id,
          name: sub.name,
          code: sub.code,
          colorToken: sub.colorToken,
          priority: sub.priority,
          examinations: {
            create: sub.examinations.map((ex) => ({
              title: ex.title,
              examDate: ex.examDate,
              weightagePercent: ex.weightage,
              targetScorePercent: ex.targetScore
            }))
          },
          units: {
            create: sub.units.map((u, uIdx) => ({
              title: u.title,
              unitNumber: uIdx + 1,
              orderIndex: uIdx,
              topics: {
                create: u.topics.map((t) => ({
                  title: t.title,
                  estimatedMinutes: t.minutes,
                  difficulty: t.difficulty,
                  importance: t.importance,
                  confidence: t.confidence,
                  status: t.status
                }))
              }
            }))
          }
        },
        include: { units: { include: { topics: true } } }
      });
      createdSubjects.push(createdSub);
    }

    // Create Active Study Plan with Today's Sessions
    const firstTopic = createdSubjects[0].units[0].topics[0];
    const secondTopic = createdSubjects[0].units[0].topics[1] || firstTopic;

    const finalsDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: user.id,
        title: `${fullName}'s Semester Mastery Plan`,
        startDate: now,
        targetEndDate: finalsDate,
        isActive: true,
        totalPlannedMinutes: 180,
        sessions: {
          create: [
            {
              topicId: firstTopic.id,
              scheduledStart: new Date(now.getTime() - 60 * 60 * 1000),
              scheduledEnd: new Date(now.getTime() - 15 * 60 * 1000),
              actualStart: new Date(now.getTime() - 60 * 60 * 1000),
              actualEnd: new Date(now.getTime() - 15 * 60 * 1000),
              durationMinutes: 45,
              actualDurationMinutes: 45,
              status: 'COMPLETED',
              sessionType: 'LEARN',
              reflectionScore: 4,
              notes: `Comprehensive review of ${firstTopic.title}. Mastered core formulas and trade-offs.`
            },
            {
              topicId: secondTopic.id,
              scheduledStart: new Date(now.getTime() + 30 * 60 * 1000),
              scheduledEnd: new Date(now.getTime() + 75 * 60 * 1000),
              durationMinutes: 45,
              status: 'PLANNED',
              sessionType: 'LEARN'
            }
          ]
        }
      }
    });

    // Seed Revision Record (SRS)
    await prisma.revisionRecord.create({
      data: {
        topicId: firstTopic.id,
        recallRating: 3,
        repetitionNumber: 1,
        easeFactor: 2.5,
        intervalDays: 1,
        nextScheduledReview: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Seed Notes & Flashcard
    await prisma.note.create({
      data: {
        userId: user.id,
        subjectId: createdSubjects[0].id,
        topicId: firstTopic.id,
        title: `${firstTopic.title} — Key Revision Guide`,
        contentMarkdown: `### ${firstTopic.title} Exam Revision\n\n1. **Core Concept:**\nEssential principles, invariants, and algorithmic trade-offs.\n\n2. **High-Yield Examination Formula:**\n$$\\text{Complexity} = O(n \\log n)$$\n\n3. **Practical Implementation:**\nVerify boundary conditions and edge cases.`,
        tags: 'Core, High-Yield, Notes',
        isAiGenerated: true
      }
    });

    await prisma.flashcard.create({
      data: {
        userId: user.id,
        topicId: firstTopic.id,
        frontText: `What is the key advantage of ${firstTopic.title}?`,
        backText: `Optimizes time complexity while ensuring mathematical correctness and memory bounds.`
      }
    });

    // Seed Initial Reward Ledger Entries
    await prisma.rewardLedgerEntry.upsert({
      where: {
        userId_eventType_sourceEventId: {
          userId: user.id,
          eventType: 'SESSION_COMPLETE',
          sourceEventId: `init_session_${user.id}`
        }
      },
      update: { xpAwarded: 25, description: `Completed verified study session on ${firstTopic.title}` },
      create: {
        userId: user.id,
        eventType: 'SESSION_COMPLETE',
        sourceEventId: `init_session_${user.id}`,
        xpAwarded: 25,
        description: `Completed verified study session on ${firstTopic.title}`
      }
    });

    await prisma.rewardLedgerEntry.upsert({
      where: {
        userId_eventType_sourceEventId: {
          userId: user.id,
          eventType: 'PLAN_GENERATED',
          sourceEventId: studyPlan.id
        }
      },
      update: { xpAwarded: 20, description: 'Generated personalized adaptive study plan.' },
      create: {
        userId: user.id,
        eventType: 'PLAN_GENERATED',
        sourceEventId: studyPlan.id,
        xpAwarded: 20,
        description: 'Generated personalized adaptive study plan.'
      }
    });

    // Seed Streak
    const todayDateStr = now.toISOString().slice(0, 10);
    await prisma.userStreak.upsert({
      where: { userId_dateString: { userId: user.id, dateString: todayDateStr } },
      update: { qualifyingMinutes: 45, sessionsCompleted: 1 },
      create: {
        userId: user.id,
        dateString: todayDateStr,
        qualifyingMinutes: 45,
        sessionsCompleted: 1
      }
    });

    return user;
  }

  const now = new Date();

  // 4. Seed USER 1: Swetha
  await seedUserWithCurriculum({
    email: 'swetha@university.edu',
    password: 'Password123!' ? '44111143' : '44111143', // 44111143
    fullName: 'Swetha',
    academicLevel: 'Computer Science & Engineering',
    subjects: [
      {
        name: 'Operating Systems & Architecture',
        code: 'CS-302',
        colorToken: 'cs',
        priority: 5,
        examinations: [
          { title: 'Midterm Examination', examDate: new Date(now.getTime() + 14 * 86400000), weightage: 30, targetScore: 92 },
          { title: 'Semester Finals', examDate: new Date(now.getTime() + 45 * 86400000), weightage: 70, targetScore: 90 }
        ],
        units: [
          {
            title: 'Unit 1: Process Management & CPU Scheduling',
            topics: [
              { title: 'Process States & Context Switching', minutes: 45, difficulty: 2, importance: 4, confidence: 4, status: 'MASTERED' },
              { title: 'CPU Scheduling: Round Robin & Multi-Level Feedback', minutes: 60, difficulty: 3, importance: 5, confidence: 3, status: 'IN_PROGRESS' },
              { title: 'Process Synchronization: Mutex & Semaphores', minutes: 60, difficulty: 4, importance: 5, confidence: 2, status: 'IN_PROGRESS' }
            ]
          },
          {
            title: 'Unit 2: Memory Management & Paging',
            topics: [
              { title: 'Virtual Memory & Multi-Level Page Tables', minutes: 45, difficulty: 4, importance: 5, confidence: 3, status: 'IN_PROGRESS' },
              { title: 'Page Replacement Algorithms (LRU, Clock)', minutes: 45, difficulty: 3, importance: 4, confidence: 3, status: 'IN_PROGRESS' }
            ]
          }
        ]
      },
      {
        name: 'Data Structures & Algorithms',
        code: 'CS-204',
        colorToken: 'physics',
        priority: 5,
        examinations: [
          { title: 'DSA Comprehensive Finals', examDate: new Date(now.getTime() + 28 * 86400000), weightage: 60, targetScore: 95 }
        ],
        units: [
          {
            title: 'Unit 1: Graph Theory & Shortest Paths',
            topics: [
              { title: "Dijkstra's & Bellman-Ford Shortest Path", minutes: 50, difficulty: 3, importance: 5, confidence: 4, status: 'MASTERED' },
              { title: 'Topological Sort & Strongly Connected Components', minutes: 40, difficulty: 3, importance: 4, confidence: 4, status: 'MASTERED' }
            ]
          }
        ]
      },
      {
        name: 'Calculus & Linear Algebra',
        code: 'MATH-201',
        colorToken: 'math',
        priority: 4,
        examinations: [
          { title: 'Linear Algebra Final Exam', examDate: new Date(now.getTime() + 21 * 86400000), weightage: 50, targetScore: 88 }
        ],
        units: [
          {
            title: 'Unit 1: Eigenvalues & Matrix Decompositions',
            topics: [
              { title: 'Characteristic Polynomials & Eigenvectors', minutes: 60, difficulty: 4, importance: 5, confidence: 3, status: 'IN_PROGRESS' },
              { title: 'Singular Value Decomposition (SVD)', minutes: 75, difficulty: 5, importance: 5, confidence: 2, status: 'IN_PROGRESS' }
            ]
          }
        ]
      }
    ]
  });

  // 5. Seed USER 2: Prathima
  await seedUserWithCurriculum({
    email: 'prathima@university.edu',
    password: 'Password123!' ? '44111111' : '44111111', // 44111111
    fullName: 'Prathima',
    academicLevel: 'Information Technology & AI',
    subjects: [
      {
        name: 'Machine Learning & Neural Networks',
        code: 'AI-401',
        colorToken: 'cs',
        priority: 5,
        examinations: [
          { title: 'AI Midterm Exam', examDate: new Date(now.getTime() + 18 * 86400000), weightage: 40, targetScore: 94 },
          { title: 'Deep Learning Finals', examDate: new Date(now.getTime() + 50 * 86400000), weightage: 60, targetScore: 92 }
        ],
        units: [
          {
            title: 'Unit 1: Supervised Learning & Gradient Descent',
            topics: [
              { title: 'Cost Functions & Gradient Descent Optimization', minutes: 50, difficulty: 3, importance: 5, confidence: 4, status: 'MASTERED' },
              { title: 'Backpropagation & Neural Activation Functions', minutes: 60, difficulty: 4, importance: 5, confidence: 3, status: 'IN_PROGRESS' }
            ]
          },
          {
            title: 'Unit 2: Transformer Architectures & Attention',
            topics: [
              { title: 'Multi-Head Self-Attention Mechanics', minutes: 60, difficulty: 5, importance: 5, confidence: 2, status: 'IN_PROGRESS' },
              { title: 'Positional Encodings & Layer Normalization', minutes: 45, difficulty: 4, importance: 4, confidence: 3, status: 'IN_PROGRESS' }
            ]
          }
        ]
      },
      {
        name: 'Database Management Systems',
        code: 'IT-305',
        colorToken: 'physics',
        priority: 4,
        examinations: [
          { title: 'DBMS Semester Exam', examDate: new Date(now.getTime() + 25 * 86400000), weightage: 50, targetScore: 90 }
        ],
        units: [
          {
            title: 'Unit 1: Relational Normalization & Transactions',
            topics: [
              { title: 'ACID Properties & Concurrency Control', minutes: 45, difficulty: 3, importance: 5, confidence: 4, status: 'MASTERED' },
              { title: '1NF, 2NF, 3NF, and BCNF Decomposition', minutes: 50, difficulty: 3, importance: 5, confidence: 4, status: 'MASTERED' }
            ]
          }
        ]
      },
      {
        name: 'Computer Networks',
        code: 'IT-302',
        colorToken: 'chem',
        priority: 4,
        examinations: [
          { title: 'Networking Fundamentals Exam', examDate: new Date(now.getTime() + 35 * 86400000), weightage: 50, targetScore: 88 }
        ],
        units: [
          {
            title: 'Unit 1: Transport Layer Protocols',
            topics: [
              { title: 'TCP Three-Way Handshake & Flow Control', minutes: 45, difficulty: 3, importance: 5, confidence: 3, status: 'IN_PROGRESS' },
              { title: 'Congestion Control: Slow Start & AIMD', minutes: 45, difficulty: 4, importance: 4, confidence: 2, status: 'IN_PROGRESS' }
            ]
          }
        ]
      }
    ]
  });

  // 6. Seed GUEST USER: Guest Scholar
  await seedUserWithCurriculum({
    email: 'guest@university.edu',
    password: 'guest-explorer-password',
    fullName: 'Guest Scholar',
    academicLevel: 'Computer Science (Guest Explorer)',
    subjects: [
      {
        name: 'Introduction to Computer Science',
        code: 'CS-101',
        colorToken: 'cs',
        priority: 5,
        examinations: [
          { title: 'Introductory Computing Assessment', examDate: new Date(now.getTime() + 14 * 86400000), weightage: 50, targetScore: 90 }
        ],
        units: [
          {
            title: 'Unit 1: Computational Thinking & Algorithms',
            topics: [
              { title: 'Algorithm Complexity & Big-O Notation', minutes: 45, difficulty: 2, importance: 5, confidence: 4, status: 'MASTERED' },
              { title: 'Data Representation & Binary Arithmetic', minutes: 40, difficulty: 2, importance: 4, confidence: 4, status: 'MASTERED' }
            ]
          }
        ]
      },
      {
        name: 'Web Engineering & Systems',
        code: 'CS-210',
        colorToken: 'physics',
        priority: 4,
        examinations: [
          { title: 'Full-Stack Practical Evaluation', examDate: new Date(now.getTime() + 20 * 86400000), weightage: 50, targetScore: 85 }
        ],
        units: [
          {
            title: 'Unit 1: Modern Web Architecture',
            topics: [
              { title: 'HTTP/HTTPS, REST APIs, and WebSockets', minutes: 45, difficulty: 3, importance: 5, confidence: 3, status: 'IN_PROGRESS' },
              { title: 'Client-Side Rendering vs SSR', minutes: 40, difficulty: 3, importance: 4, confidence: 3, status: 'IN_PROGRESS' }
            ]
          }
        ]
      }
    ]
  });

  console.log('--- Database Seeding Completed Successfully ---');
}

seed()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
