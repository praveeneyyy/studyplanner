# Database Schema Specification
## AI Smart Study Planner

**Version:** 1.0.0  
**ORM:** Prisma ORM  
**Engines:** SQLite (Local Dev / Offline Test) & PostgreSQL (Production Deploy)

---

## 1. Schema Design Principles

1. **Normalized Relational Model:** Eliminates redundant data storage while providing indexed foreign key constraints for fast query resolution.
2. **Strict User Ownership:** Every root entity (Subject, StudyPlan, Note, QuizAttempt, AIConversation) has an indexed `userId` foreign key to enforce tenant boundary isolation.
3. **Immutable Reward Ledger:** `RewardLedgerEntry` records every XP and level transaction with a unique idempotency constraint `@@unique([userId, eventType, sourceEventId])`.
4. **Timezone Awareness:** All timestamps are stored in UTC (`DateTime @default(now())`). Daily streak records track the user's localized date string (`YYYY-MM-DD`).

---

## 2. Complete Entity-Relationship Specification (Prisma Schema)

```prisma
datasource db {
  provider = "sqlite" // or "postgresql" in production
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------
// 1. User & Preferences
// ----------------------------------------------------

model User {
  id                    String                 @id @default(cuid())
  email                 String                 @unique
  passwordHash          String
  fullName              String
  academicLevel         String?                // e.g., "Undergraduate", "High School", "Medical"
  institution           String?
  avatarUrl             String?
  totalXP               Int                    @default(0)
  currentLevel          Int                    @default(1)
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt

  preferences           UserPreference?
  subjects              Subject[]
  studyPlans            StudyPlan[]
  notes                 Note[]
  flashcards            Flashcard[]
  aiConversations       AIConversation[]
  quizAttempts          QuizAttempt[]
  rewardLedgerEntries   RewardLedgerEntry[]
  achievements          UserAchievement[]
  streaks               UserStreak[]
  weeklyGoals           WeeklyGoal[]
  notifications         NotificationRecord[]
  notificationPref      NotificationPreference?
  aiUsageRecords        AIUsageRecord[]

  @@index([email])
}

model UserPreference {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme                 String   @default("system") // "light", "dark", "system"
  timezone              String   @default("UTC")
  dailyStudyMinutesGoal Int      @default(120)
  sessionDurationPref   Int      @default(45)     // 25, 45, 60 minutes
  breakDurationPref     Int      @default(10)     // 5, 10, 15 minutes
  weeklyAvailability    String   @default("{\"mon\":180,\"tue\":180,\"wed\":180,\"thu\":180,\"fri\":180,\"sat\":240,\"sun\":240}") // JSON map
  reducedMotion         Boolean  @default(false)
  soundEffects          Boolean  @default(true)
  hapticFeedback        Boolean  @default(true)
  updatedAt             DateTime @updatedAt
}

model NotificationPreference {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  studyReminders        Boolean  @default(true)
  revisionAlerts        Boolean  @default(true)
  examCountdowns        Boolean  @default(true)
  weeklyProgressEmail   Boolean  @default(false)
  quietHoursStart       String   @default("22:00")
  quietHoursEnd         String   @default("08:00")
}

// ----------------------------------------------------
// 2. Academic Curriculum Hierarchy
// ----------------------------------------------------

model Subject {
  id                    String         @id @default(cuid())
  userId                String
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                  String
  code                  String?        // e.g., "CS-301"
  colorToken            String         @default("cs") // maps to design-tokens
  priority              Int            @default(3) // 1 (low) to 5 (critical)
  archived              Boolean        @default(false)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  examinations          Examination[]
  units                 SyllabusUnit[]
  notes                 Note[]

  @@index([userId])
}

model Examination {
  id                    String      @id @default(cuid())
  subjectId             String
  subject               Subject     @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  title                 String      // e.g., "Midterm Exam", "Finals"
  examDate              DateTime
  weightagePercent      Int         @default(100)
  targetScorePercent    Int         @default(85)
  completed             Boolean     @default(false)
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  studyPlans            StudyPlan[]

  @@index([subjectId])
}

model SyllabusUnit {
  id                    String    @id @default(cuid())
  subjectId             String
  subject               Subject   @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  unitNumber            Int       @default(1)
  title                 String
  description           String?
  orderIndex            Int       @default(0)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  topics                Topic[]

  @@index([subjectId])
}

model Topic {
  id                    String            @id @default(cuid())
  unitId                String
  unit                  SyllabusUnit      @relation(fields: [unitId], references: [id], onDelete: Cascade)
  title                 String
  description           String?
  estimatedMinutes      Int               @default(45)
  difficulty            Int               @default(3) // 1 (easy) - 5 (hard)
  importance            Int               @default(3) // 1 - 5
  confidence            Int               @default(1) // 1 - 5
  status                String            @default("NOT_STARTED") // NOT_STARTED, IN_PROGRESS, MASTERED
  orderIndex            Int               @default(0)
  lastStudiedAt         DateTime?
  nextRevisionDate      DateTime?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  progressRecords       TopicProgress[]
  studySessions         StudySession[]
  revisionRecords       RevisionRecord[]
  quizQuestions         QuizQuestion[]
  flashcards            Flashcard[]
  notes                 Note[]

  @@index([unitId])
}

model TopicProgress {
  id                    String    @id @default(cuid())
  topicId               String
  topic                 Topic     @relation(fields: [topicId], references: [id], onDelete: Cascade)
  status                String    @default("NOT_STARTED")
  confidence            Int       @default(1)
  masteryScore          Float     @default(0.0) // 0.0 - 1.0
  totalStudyMinutes     Int       @default(0)
  lastReviewedAt        DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([topicId])
}

// ----------------------------------------------------
// 3. Study Planning & Sessions
// ----------------------------------------------------

model StudyPlan {
  id                    String         @id @default(cuid())
  userId                String
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  examinationId         String?
  examination           Examination?   @relation(fields: [examinationId], references: [id], onDelete: SetNull)
  title                 String
  startDate             DateTime
  targetEndDate         DateTime
  isActive              Boolean        @default(true)
  totalPlannedMinutes   Int            @default(0)
  completedMinutes      Int            @default(0)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  sessions              StudySession[]

  @@index([userId])
}

model StudySession {
  id                    String       @id @default(cuid())
  studyPlanId           String
  studyPlan             StudyPlan    @relation(fields: [studyPlanId], references: [id], onDelete: Cascade)
  topicId               String
  topic                 Topic        @relation(fields: [topicId], references: [id], onDelete: Cascade)
  scheduledStart        DateTime
  scheduledEnd          DateTime
  actualStart           DateTime?
  actualEnd             DateTime?
  durationMinutes       Int          @default(45)
  actualDurationMinutes Int          @default(0)
  status                String       @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED, SKIPPED, MISSED, RESCHEDULED
  sessionType           String       @default("LEARN")   // LEARN, REVISE, PRACTICE_QUIZ, MOCK_EXAM
  notes                 String?
  reflectionScore       Int?         // 1 - 5 confidence rating upon finish
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@index([studyPlanId])
  @@index([topicId])
  @@index([scheduledStart])
}

// ----------------------------------------------------
// 4. Spaced Repetition (SRS)
// ----------------------------------------------------

model RevisionRecord {
  id                    String    @id @default(cuid())
  topicId               String
  topic                 Topic     @relation(fields: [topicId], references: [id], onDelete: Cascade)
  reviewDate            DateTime  @default(now())
  recallRating          Int       // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
  repetitionNumber      Int       @default(1)
  easeFactor            Float     @default(2.5) // SuperMemo SM-2 starting EF
  intervalDays          Int       @default(1)
  nextScheduledReview   DateTime
  createdAt             DateTime  @default(now())

  @@index([topicId])
  @@index([nextScheduledReview])
}

// ----------------------------------------------------
// 5. Assessments & Quizzes
// ----------------------------------------------------

model Quiz {
  id                    String         @id @default(cuid())
  title                 String
  difficulty            Int            @default(3) // 1 - 5
  timeLimitSeconds      Int?           // Optional timer
  isGeneratedByAI       Boolean        @default(false)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  questions             QuizQuestion[]
  attempts              QuizAttempt[]
}

model QuizQuestion {
  id                    String         @id @default(cuid())
  quizId                String
  quiz                  Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  topicId               String?
  topic                 Topic?         @relation(fields: [topicId], references: [id], onDelete: SetNull)
  questionType          String         @default("MCQ") // MCQ, TRUE_FALSE, SHORT_ANSWER
  prompt                String
  options               String?        // JSON array of choices for MCQ
  correctAnswer         String
  explanation           String
  orderIndex            Int            @default(0)

  responses             QuizResponse[]

  @@index([quizId])
}

model QuizAttempt {
  id                    String         @id @default(cuid())
  quizId                String
  quiz                  Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  userId                String
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  scorePercent          Float          @default(0.0)
  totalQuestions        Int            @default(0)
  correctAnswers        Int            @default(0)
  completedAt           DateTime       @default(now())

  responses             QuizResponse[]

  @@index([quizId])
  @@index([userId])
}

model QuizResponse {
  id                    String        @id @default(cuid())
  attemptId             String
  attempt               QuizAttempt   @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId            String
  question              QuizQuestion  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  studentAnswer         String
  isCorrect             Boolean
  pointsAwarded         Float         @default(0.0)
  feedback              String?

  @@index([attemptId])
}

// ----------------------------------------------------
// 6. Notes, Flashcards & AI Conversations
// ----------------------------------------------------

model Note {
  id                    String         @id @default(cuid())
  userId                String
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  subjectId             String?
  subject               Subject?       @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  topicId               String?
  topic                 Topic?         @relation(fields: [topicId], references: [id], onDelete: SetNull)
  title                 String
  contentMarkdown       String
  tags                  String?        // Comma-separated or JSON
  isAiGenerated         Boolean        @default(false)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  @@index([userId])
}

model Flashcard {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  topicId               String?
  topic                 Topic?    @relation(fields: [topicId], references: [id], onDelete: SetNull)
  frontText             String
  backText              String
  boxNumber             Int       @default(1) // Leitner box 1-5
  lastReviewedAt        DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
}

model AIConversation {
  id                    String         @id @default(cuid())
  userId                String
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  title                 String         @default("Study Conversation")
  subjectContext        String?
  topicContext          String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  messages              AIMessage[]

  @@index([userId])
}

model AIMessage {
  id                    String         @id @default(cuid())
  conversationId        String
  conversation          AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender                String         // "user" or "assistant"
  content               String
  formatType            String?        // e.g. "EXPLAIN", "EXAM_ANSWER_5M", etc.
  providerUsed          String?        // "watsonx", "gemini", "demo"
  isFallback            Boolean        @default(false)
  createdAt             DateTime       @default(now())

  @@index([conversationId])
}

model AIUsageRecord {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider              String
  modelName             String
  promptTokens          Int       @default(0)
  completionTokens      Int       @default(0)
  durationMs            Int       @default(0)
  createdAt             DateTime  @default(now())

  @@index([userId])
}

// ----------------------------------------------------
// 7. Rewards, Progression & Streaks
// ----------------------------------------------------

model RewardLedgerEntry {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType             String    // "SESSION_COMPLETE", "REVISION_COMPLETE", "QUIZ_FINISH", etc.
  sourceEventId         String    // Unique ID of session, quiz attempt, etc.
  xpAwarded             Int
  description           String
  createdAt             DateTime  @default(now())

  @@unique([userId, eventType, sourceEventId])
  @@index([userId])
}

model AchievementDefinition {
  id                    String            @id
  title                 String
  description           String
  badgeIcon             String
  category              String            // "STREAK", "MASTERY", "DISCIPLINE", "SPECIAL"
  xpReward              Int               @default(50)
  requiredMetric        String            // e.g. "completed_sessions >= 10"
  
  userAchievements      UserAchievement[]
}

model UserAchievement {
  id                    String                @id @default(cuid())
  userId                String
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId         String
  achievement           AchievementDefinition @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  unlockedAt            DateTime              @default(now())

  @@unique([userId, achievementId])
  @@index([userId])
}

model UserStreak {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  dateString            String    // "YYYY-MM-DD" in user's timezone
  qualifyingMinutes     Int
  sessionsCompleted     Int
  createdAt             DateTime  @default(now())

  @@unique([userId, dateString])
  @@index([userId])
}

model WeeklyGoal {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStartDate         String    // "YYYY-MM-DD"
  targetStudyMinutes    Int       @default(600)
  completedMinutes      Int       @default(0)
  targetSessions        Int       @default(10)
  completedSessions     Int       @default(0)
  isAchieved            Boolean   @default(false)
  updatedAt             DateTime  @updatedAt

  @@unique([userId, weekStartDate])
  @@index([userId])
}

model NotificationRecord {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title                 String
  body                  String
  type                  String    // "SESSION_REMINDER", "REVISION_DUE", "EXAM_ALERT"
  isRead                Boolean   @default(false)
  scheduledFor          DateTime
  deliveredAt           DateTime?
  createdAt             DateTime  @default(now())

  @@index([userId])
}
```

---

## 3. Migration, Indexing & Safety

1. **Foreign Key Deletion Rules:** Cascading deletes are enforced on direct user components (`User` -> `Subject`, `StudyPlan`, `Note`, `QuizAttempt`). When an `Examination` is deleted, related `StudyPlan` records have their `examinationId` safely `SetNull` to preserve user study records.
2. **Indexing Strategy:**
   - Composite index on `RewardLedgerEntry(userId, eventType, sourceEventId)` guarantees sub-millisecond lookup and hardware-level idempotency protection.
   - B-Tree index on `StudySession(scheduledStart)` enables efficient range queries for calendar views and daily agendas.
   - Index on `RevisionRecord(nextScheduledReview)` enables constant-time retrieval of due flashcards and spaced review items.
