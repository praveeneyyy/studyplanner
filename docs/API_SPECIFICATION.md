# REST API Specification (`/api/v1`)
## AI Smart Study Planner

**Version:** 1.0.0  
**Base URL:** `http://localhost:4000/api/v1` (or production hostname)  
**Security:** Bearer Token (JWT) in Authorization Header or HTTP-Only SameSite Cookie.

---

## 1. Global Standards & Error Format

All error responses return a standardized structured JSON object:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body failed schema validation.",
    "details": [
      {
        "field": "title",
        "issue": "String must contain at least 2 character(s)"
      }
    ],
    "timestamp": "2026-10-22T17:15:00.000Z"
  }
}
```

Standard HTTP Status Codes:
- `200 OK`: Successful read or update.
- `201 Created`: Successful resource creation.
- `400 Bad Request`: Validation failure or domain constraint violation.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Resource belongs to another user.
- `404 Not Found`: Target entity does not exist.
- `409 Conflict`: Conflict with scheduling constraints or idempotency key collision.
- `429 Too Many Requests`: Rate limit reached.
- `500 Internal Server Error`: Unexpected runtime failure.

---

## 2. Authentication & Profile Endpoints

### 2.1 Register
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "student@university.edu",
    "password": "SecurePassword123!",
    "fullName": "Alex Mercer",
    "academicLevel": "Undergraduate",
    "institution": "State University"
  }
  ```
- **Response `201`:**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "usr_101", "email": "student@university.edu", "fullName": "Alex Mercer", "totalXP": 0, "currentLevel": 1 },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

### 2.2 Login
- **POST** `/auth/login`
- **Body:** `{ "email": "student@university.edu", "password": "SecurePassword123!" }`
- **Response `200`:** `{ "success": true, "data": { "user": { ... }, "token": "..." } }`

### 2.3 Current User & Profile
- **GET** `/auth/me`
- **PUT** `/auth/profile`
  - **Body:** `{ "fullName": "Alex M.", "institution": "Tech Institute" }`

---

## 3. Subjects, Examinations & Syllabus Endpoints

### 3.1 Subject Management
- **GET** `/subjects` (Returns all active and archived subjects for user)
- **POST** `/subjects`
  - **Body:** `{ "name": "Operating Systems", "code": "CS-302", "colorToken": "cs", "priority": 4 }`
- **GET** `/subjects/:id` (Returns subject with nested units, topics, and exam countdowns)
- **PUT** `/subjects/:id`
- **DELETE** `/subjects/:id`

### 3.2 Examinations
- **POST** `/examinations`
  - **Body:** `{ "subjectId": "sub_1", "title": "Finals", "examDate": "2026-11-20T09:00:00Z", "weightagePercent": 50, "targetScorePercent": 90 }`
- **PUT** `/examinations/:id`
- **DELETE** `/examinations/:id`

### 3.3 Units & Topics
- **POST** `/subjects/:subjectId/units`
  - **Body:** `{ "title": "Memory Management", "unitNumber": 3, "orderIndex": 2 }`
- **POST** `/units/:unitId/topics`
  - **Body:** `{ "title": "Virtual Memory & Paging", "estimatedMinutes": 60, "difficulty": 4, "importance": 5, "confidence": 2 }`
- **PUT** `/topics/:id`
  - **Body:** `{ "confidence": 4, "status": "MASTERED" }`
- **POST** `/subjects/:subjectId/import-syllabus`
  - **Body:** `{ "units": [ { "title": "Unit 1", "topics": [ { "title": "Topic A", "estimatedMinutes": 45 } ] } ] }`

---

## 4. Deterministic Study Planning & Sessions

### 4.1 Preview Plan Generation
- **POST** `/planner/preview`
  - **Body:**
    ```json
    {
      "startDate": "2026-10-23T00:00:00Z",
      "targetEndDate": "2026-11-20T00:00:00Z",
      "subjectIds": ["sub_1", "sub_2"],
      "dailyHoursLimit": 4,
      "sessionDurationMinutes": 45,
      "breakMinutes": 10
    }
    ```
  - **Response `200`:**
    ```json
    {
      "success": true,
      "data": {
        "isFeasible": true,
        "totalTopicsScheduled": 24,
        "totalPlannedHours": 22.5,
        "bufferDays": 3,
        "previewSessions": [
          { "topicTitle": "Process Scheduling", "subjectName": "OS", "date": "2026-10-23", "start": "09:00", "end": "09:45" }
        ]
      }
    }
    ```

### 4.2 Confirm & Persist Plan
- **POST** `/planner/confirm`
  - **Body:** Same as preview, commits records to `StudyPlan` and `StudySession` in a single transaction.

### 4.3 Sessions Retrieval & Calendar
- **GET** `/sessions?startDate=2026-10-23&endDate=2026-10-30`
  - Returns array of `StudySession` items joined with `Topic` and `Subject`.

### 4.4 Start, Pause & Complete Session
- **POST** `/sessions/:id/start` (Sets `status: "IN_PROGRESS"`, `actualStart: now()`)
- **POST** `/sessions/:id/complete`
  - **Body:**
    ```json
    {
      "actualDurationMinutes": 45,
      "reflectionScore": 4,
      "notes": "Covered page tables and TLB miss handling."
    }
    ```
  - **Response `200`:**
    ```json
    {
      "success": true,
      "data": {
        "session": { "id": "ses_1", "status": "COMPLETED" },
        "reward": {
          "xpAwarded": 25,
          "newTotalXP": 325,
          "levelUp": false,
          "streakIncremented": true
        }
      }
    }
    ```

### 4.5 Reschedule & Recover Missed Sessions
- **POST** `/sessions/:id/reschedule`
  - **Body:** `{ "newStart": "2026-10-24T14:00:00Z", "newEnd": "2026-10-24T14:45:00Z" }`
- **POST** `/planner/recover-missed`
  - Automatically sweeps past sessions marked `PLANNED` or `MISSED` and inserts them into upcoming available slots without exceeding daily study hours.

---

## 5. AI Study Assistant & Real-Time Streaming

### 5.1 Conversations
- **GET** `/ai/conversations` (List user conversations)
- **POST** `/ai/conversations`
  - **Body:** `{ "title": "Paging vs Segmentation", "subjectContext": "OS", "topicContext": "Virtual Memory" }`
- **GET** `/ai/conversations/:id` (Returns all messages)

### 5.2 Server-Sent Events (SSE) AI Streaming
- **POST** `/ai/stream`
  - **Headers:** `Accept: text/event-stream`
  - **Body:**
    ```json
    {
      "conversationId": "conv_1",
      "prompt": "Explain how a Translation Lookaside Buffer (TLB) works.",
      "formatType": "EXAM_ANSWER_5M",
      "topicId": "top_paging"
    }
    ```
  - **Stream Events:**
    - `event: delta`: `{ "text": "A Translation Lookaside Buffer (TLB) is..." }`
    - `event: done`: `{ "messageId": "msg_ assistant_1", "tokensUsed": 142, "provider": "watsonx" }`
    - `event: fallback`: `{ "warning": "External AI unavailable. Provided verified curriculum tutor answer.", "provider": "demo" }`

### 5.3 Automated Content Generators
- **POST** `/ai/generate-notes` (Generates structured Markdown note for a topic)
- **POST** `/ai/generate-quiz` (Generates 5–10 MCQ and short-answer questions with explanations)
- **POST** `/ai/generate-flashcards` (Generates front/back Q&A cards)

---

## 6. Assessments, Quizzes & Weak-Topic Detection

### 6.1 Quizzes
- **GET** `/quizzes/:id`
- **POST** `/quizzes/attempts`
  - **Body:** `{ "quizId": "quiz_1" }`
- **POST** `/quizzes/attempts/:attemptId/submit`
  - **Body:**
    ```json
    {
      "responses": [
        { "questionId": "q_1", "studentAnswer": "Option B" },
        { "questionId": "q_2", "studentAnswer": "True" }
      ]
    }
    ```
  - **Response `200`:**
    ```json
    {
      "success": true,
      "data": {
        "scorePercent": 85.0,
        "correctCount": 4,
        "totalQuestions": 5,
        "reward": { "xpAwarded": 25, "bonusXP": 15 },
        "topicMasteryUpdated": true
      }
    }
    ```

### 6.2 Weak Topics Analysis
- **GET** `/quizzes/weak-topics`
  - Returns topics where average score < 60% or confidence rating <= 2, sorted by exam urgency.

---

## 7. Spaced Repetition (SRS)

### 7.1 Revision Queue
- **GET** `/revision/queue`
  - Returns topics classified into `dueToday`, `overdue`, and `upcomingNext7Days`.

### 7.2 Record Active Recall Outcome
- **POST** `/revision/record-recall`
  - **Body:**
    ```json
    {
      "topicId": "top_paging",
      "recallRating": 3 // 1: Again, 2: Hard, 3: Good, 4: Easy
    }
    ```
  - **Response `200`:**
    ```json
    {
      "success": true,
      "data": {
        "repetitionNumber": 3,
        "easeFactor": 2.5,
        "intervalDays": 6,
        "nextReviewDate": "2026-10-28T09:00:00Z",
        "reward": { "xpAwarded": 15 }
      }
    }
    ```

---

## 8. Rewards, Gamification & Streaks

### 8.1 Summary
- **GET** `/rewards/summary`
  - Returns `totalXP`, `currentLevel`, `nextLevelXP`, `streakCount`, `weeklyGoalProgress`, `recentBadges`.

### 8.2 Achievements & Ledger
- **GET** `/rewards/achievements` (List of unlocked and locked achievements with conditions)
- **GET** `/rewards/ledger` (Auditable pagination of all XP transactions)

---

## 9. Analytics & Readiness

- **GET** `/analytics/dashboard` (Today's planned vs actual hours, weekly breakdown, syllabus completion rate)
- **GET** `/analytics/readiness/:subjectId` (Calculated readiness percentage, syllabus coverage, quiz average)

---

## 10. User Preferences

- **GET** `/preferences`
- **PUT** `/preferences`
  - **Body:** `{ "theme": "dark", "dailyStudyMinutesGoal": 180, "reducedMotion": false }`
