# Gamification & Productivity Reward Specification
## AI Smart Study Planner

**Version:** 1.0.0  
**Design Philosophy:** Ethical, verified, non-coercive gamification designed to encourage genuine academic focus and prevent toxic grind burnout.

---

## 1. Verified Reward Ledger Architecture

All XP gains, level promotions, and achievement unlocks are processed exclusively by the backend service through an append-only transaction ledger (`RewardLedgerEntry`).

### 1.1 Anti-Abuse & Anti-Spam Principles
1. **No Passive XP:** Merely opening the app, clicking tabs, or browsing topics awards 0 XP.
2. **Session Verification:** To earn the 25 XP for a completed study session:
   - The session must have been in state `PLANNED` or `IN_PROGRESS`.
   - `actualDurationMinutes` must be $\ge 70\%$ of `plannedDurationMinutes` and $\ge 15$ continuous minutes.
3. **Hardware-Level Idempotency:** The database table enforces `@@unique([userId, eventType, sourceEventId])`. A replayed HTTP request returns the cached outcome with no duplicate XP awarded.
4. **Assessment Integrity:** Re-taking the exact same quiz multiple times yields XP only once for the initial pass; subsequent retakes only update mastery metrics unless a higher score bracket is unlocked.

---

## 2. XP Reward Ledger Schedule

| Event Type | Base XP | Eligibility / Conditions | Maximum Frequency |
| :--- | :--- | :--- | :--- |
| `SESSION_COMPLETE` | **25 XP** | Verified $\ge 20\text{ min}$ focused study session | Max 6 sessions / day |
| `REVISION_COMPLETE` | **15 XP** | Completed scheduled spaced repetition review | 1 per topic per day |
| `QUIZ_FINISH` | **10 XP** | Completed all questions in a generated quiz | 1 per unique quiz |
| `QUIZ_HIGH_SCORE` | **+15 Bonus XP** | Scored $\ge 80\%$ on first quiz attempt | 1 per unique quiz |
| `UNIT_MASTERED` | **50 XP** | All topics in a syllabus unit reach 'Mastered' | Once per syllabus unit |
| `DAILY_GOAL_MET` | **30 XP** | Completed $100\%$ of user-set daily study minutes | Once per calendar day |
| `MOCK_EXAM_COMPLETE` | **40 XP** | Completed full-length timed mock assessment | Once per exam date |
| `PLAN_GENERATED` | **20 XP** | Completed initial 10-step onboarding & plan commit | One-time milestone |

---

## 3. Level Progression & Ranks

Progression is calculated directly from `user.totalXP` via the documented exponential formula:

```text
Level 1: Novice Scholar       [0 - 200 XP]
Level 2: Consistent Learner   [201 - 600 XP]
Level 3: Focused Scholar      [601 - 1,400 XP]
Level 4: Knowledge Builder    [1,401 - 3,000 XP]
Level 5: Master Scholar       [3,001 - 5,500 XP]
Level 6: Academic Paragon     [5,501+ XP]
```

When a user reaches a new level:
- Server marks `levelUp: true` in the API response.
- Client triggers a gentle celebration modal accompanied by subtle haptic feedback (on mobile) or a refined canvas particle burst (on web).

---

## 4. Testable Achievement Definitions

| ID | Title | Category | Description | Verification Criterion | Reward |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ach_first_session` | First Step | DISCIPLINE | Completed your first verified study session. | `completed_sessions >= 1` | 25 XP |
| `ach_quiz_novice` | Fact Checker | MASTERY | Completed your first topical quiz. | `completed_quizzes >= 1` | 20 XP |
| `ach_quiz_ace` | Perfect Recall | MASTERY | Scored 100% on any generated quiz. | `quiz_attempt.scorePercent == 100` | 40 XP |
| `ach_topic_master` | Concept Master | MASTERY | Brought a topic to 100% mastery. | `topic.status == 'MASTERED'` | 30 XP |
| `ach_streak_3` | Habit Forming | STREAK | Maintained a 3-day active study streak. | `current_streak >= 3` | 35 XP |
| `ach_streak_7` | Weekly Momentum | STREAK | Maintained a 7-day active study streak. | `current_streak >= 7` | 75 XP |
| `ach_revision_champ`| Memory Architect| DISCIPLINE | Completed 10 spaced repetition reviews. | `completed_revisions >= 10` | 50 XP |
| `ach_unit_complete` | Unit Conqueror | MASTERY | Completed an entire academic syllabus unit. | `unit.topics.every(mastered)` | 60 XP |
| `ach_deep_focus` | Deep Diver | DISCIPLINE | Completed a single 60-minute deep work block.| `session.actualDuration >= 60` | 30 XP |
| `ach_comeback` | Renaissance | SPECIAL | Resumed study and finished a session after 5+ days away. | `daysSinceLastSession >= 5 && completed` | 40 XP |

---

## 5. Streak Integrity & Rest-Day Policy

Students often face exhaustion when gamified streaks punish legitimate illness, rest days, or scheduled breaks.

1. **Rest Day Policy:** Users can designate up to 1 day per week (default: Sunday) as a configured "Rest Day". On rest days, the streak is frozen and preserved even if 0 minutes are recorded.
2. **Grace Day Freeze:** If a user misses a single weekday, their streak enters `FROZEN` status for 24 hours. If they complete a double session the next day, the streak is restored.
3. **Local Timezone Precision:** The date of completion is computed using the user's explicit timezone offset, preventing premature resets when traveling or studying late at night.
