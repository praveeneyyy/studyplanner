# Comprehensive Testing Strategy & Quality Assurance
## AI Smart Study Planner

**Version:** 1.0.0  
**Test Runner:** Vitest (Node.js backend & domain algorithms) + React Testing Library  
**Target:** 100% deterministic test passage for core business logic, scheduling integrity, and reward calculations.

---

## 1. Automated Test Hierarchy

```text
Unit Tests (Pure Domain Algorithms)
├── schedulingEngine.test.ts    # Constraint satisfaction, priority sorting, buffer reservation
├── spacedRepetition.test.ts    # SuperMemo SM-2 math, interval expansion, ease factor clamping
├── rewardLedger.test.ts        # Idempotency, XP caps, level progression formula
└── streakCalculator.test.ts    # Localized timezone date boundary validation

Integration / API Tests (Express + In-Memory SQLite)
├── auth.test.ts                # Register, login, duplicate email prevention, password hashing
├── subjects.test.ts            # Curriculum hierarchy CRUD and syllabus import
├── plannerApi.test.ts          # Preview & commit plan, session status transitions
├── aiGateway.test.ts           # 16-format prompt construction, demo fallback verification
└── revisionApi.test.ts         # Active recall queue sorting and next-review timestamps
```

---

## 2. Critical Edge Cases Tested

### 2.1 Scheduling Constraints
- **Infeasible Exam Schedule:** When total topic minutes exceed total available study hours before the exam date, the planner must return a `FeasibilityWarning` with the exact deficit rather than crashing or generating invalid dates.
- **Overlapping Slots:** Tests verify that for $N$ generated sessions across a 30-day window, every session has `start < end` and no two sessions share any overlapping timestamp.
- **Completed Work Invariant:** When regenerating a plan, all sessions with status `COMPLETED` are preserved intact.

### 2.2 Reward & Ledger Idempotency
- **Replay Attack:** Firing 5 identical `POST /sessions/:id/complete` requests in rapid succession awards exactly 25 XP once; the subsequent 4 calls return the identical ledger entry with 0 duplicate XP.
- **Duration Fraud:** Submitting a completion request for a 45-minute session with `actualDuration: 3` is rejected with `400 Bad Request`.

### 2.3 AI Provider Resilience
- Simulates external network failure (HTTP 503 / timeout) and confirms that the response seamlessly degrades to the verified academic knowledge base without leaking stack traces.
