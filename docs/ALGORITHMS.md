# Core Algorithms & Mathematical Specifications
## AI Smart Study Planner

**Version:** 1.0.0  
**Domain Layer Package:** `@ai-study/domain`

---

## 1. Deterministic Study-Plan Scheduling Algorithm

The scheduling engine solves a constrained bin-packing problem where academic topics are scheduled into available daily study windows.

### 1.1 Priority Scoring Function
Every topic $T_i$ is assigned a dynamic priority score $P(T_i) \in [1.0, 10.0]$:

$$P(T_i) = w_1 \cdot D(T_i) + w_2 \cdot I(T_i) + w_3 \cdot (6 - C(T_i)) + w_4 \cdot U(T_i)$$

Where:
- $D(T_i) \in [1, 5]$: Difficulty rating.
- $I(T_i) \in [1, 5]$: Syllabus importance / weightage.
- $C(T_i) \in [1, 5]$: Student self-rated confidence (inverted: lower confidence increases priority).
- $U(T_i) \in [1, 5]$: Examination urgency factor:
  $$U(T_i) = \max\left(1, \min\left(5, \left\lfloor \frac{30}{\text{daysUntilExam} + 1} \right\rfloor \right)\right)$$
- Default weights: $w_1 = 0.25, w_2 = 0.35, w_3 = 0.25, w_4 = 0.15$.

### 1.2 Constraint Satisfaction Rules
1. **Capacity Limit:** Total scheduled minutes on day $d$ cannot exceed $A(d) - B(d)$, where $A(d)$ is available minutes from preferences and $B(d)$ is blocked minutes.
2. **Session Granularity:** Topics are divided into blocks matching the student's preferred block length (default: 45 min).
3. **Mandatory Rest Breaks:** A rest interval $R = 10\text{ min}$ is automatically enforced after each study session.
4. **Pre-Exam Buffer:** The final $15\%$ of days leading up to an examination date are reserved exclusively for `REVISE` sessions and mock assessments.
5. **Non-Overlapping Invariant:** For any two sessions $S_a, S_b$, $[S_a.\text{start}, S_a.\text{end}) \cap [S_b.\text{start}, S_b.\text{end}) = \emptyset$.

---

## 2. Adaptive Rescheduling & Missed-Session Recovery

When a student fails to complete a scheduled session by end-of-day:

```text
Algorithm RecoverMissedSessions:
Input: CurrentDate, UserAvailabilityMap, UncompletedSessionsList
Output: UpdatedSessionSchedule

1. Sort UncompletedSessionsList by Topic Priority P(T) DESC.
2. For each Session S in UncompletedSessionsList:
3.    Search future dates d in [CurrentDate + 1, ExamDate - BufferDays]:
4.       Calculate remaining capacity: RemCap(d) = DailyCap(d) - ScheduledMinutes(d)
5.       If RemCap(d) >= S.durationMinutes:
6.          Reschedule S to earliest available slot in date d
7.          Mark S.status = 'RESCHEDULED'
8.          Break (proceed to next session)
9.    If S could not be fitted before ExamDate:
10.      Flag 'SCHEDULE_OVERLOAD_WARNING' to user
11.      Prompt user to increase daily study hours or adjust elective syllabus scope.
```

---

## 3. Spaced Repetition (SuperMemo SM-2 Adaptive Implementation)

Active recall ratings are mapped onto the integer scale $q \in \{1, 2, 3, 4\}$:
- $q = 1$: **Again** (Complete blackout / Fail)
- $q = 2$: **Hard** (Recalled with intense effort or partial errors)
- $q = 3$: **Good** (Correct recall after reasonable hesitation)
- $q = 4$: **Easy** (Instant, effortless recall)

### Mathematical Formulation:
Let $n$ be the repetition count, $EF$ be the Ease Factor ($EF_0 = 2.5$), and $I$ be the interval in days:

$$\text{If } q < 3 \text{ (Again or Hard)}: \quad n \leftarrow 1, \quad I \leftarrow 1$$

$$\text{If } q \ge 3 \text{ (Good or Easy)}:$$
$$I(1) = 1 \text{ day}$$
$$I(2) = 6 \text{ days}$$
$$I(n) = \text{round}(I(n - 1) \cdot EF) \quad \text{for } n > 2$$

$$EF' = \max\left(1.3, \; EF + \left(0.1 - (4 - q) \cdot (0.08 + (4 - q) \cdot 0.02)\right)\right)$$

Next review timestamp:
$$\text{NextReviewDate} = \text{CurrentReviewDate} + I(n) \text{ days}$$

---

## 4. Weak-Topic Classification & Exam Readiness Metric

### 4.1 Weak-Topic Categorization
Based on empirical quiz scores ($S_{\text{quiz}} \in [0, 100]$) and review recall history:

$$\text{MasteryScore}(T) = 0.5 \cdot \overline{S}_{\text{quiz}}(T) + 0.3 \cdot (C(T) \cdot 20) + 0.2 \cdot \min\left(100, \frac{n_{\text{reps}}}{5} \cdot 100\right)$$

- **Needs Immediate Attention:** $\text{MasteryScore} < 50\%$
- **Developing:** $50\% \le \text{MasteryScore} < 70\%$
- **Proficient:** $70\% \le \text{MasteryScore} < 85\%$
- **Mastered:** $\text{MasteryScore} \ge 85\%$

### 4.2 Exam Readiness Index
For any subject containing topics $T_1, \dots, T_m$:

$$\text{ReadinessIndex} = \frac{1}{\sum_{i=1}^m I(T_i)} \sum_{i=1}^m \left( I(T_i) \cdot \text{MasteryScore}(T_i) \right)$$

Displayed on the Dashboard as a clear percentage readiness bar.

---

## 5. Streak & Timezone Boundary Algorithm

A user's streak increments by 1 if and only if they record at least 1 verified session ($\ge 20$ minutes) or 1 completed revision within the 24-hour localized date window (`YYYY-MM-DD` in `user.timezone`).

```text
Let userDate = FormatDateInTimezone(now(), user.timezone)
Let prevDate = FormatDateInTimezone(now() - 24 hours, user.timezone)

If StreakRecord exists for userDate:
   // Already counted today; do not double count
   Return CurrentStreak

If StreakRecord exists for prevDate:
   CurrentStreak += 1
   Insert StreakRecord(userDate)
Else:
   CurrentStreak = 1 // Reset streak (or invoke Grace Day if configured)
   Insert StreakRecord(userDate)
```

---

## 6. XP and Level Progression Formula

The XP required to reach Level $L$ grows progressively to encourage long-term academic discipline:

$$\text{Threshold}(L) = 150 \cdot L^{1.6}$$

Cumulative XP Table:
- **Level 1 (Novice):** 0 XP
- **Level 2 (Consistent Learner):** 200 XP
- **Level 3 (Focused Scholar):** 600 XP
- **Level 4 (Knowledge Builder):** 1,400 XP
- **Level 5 (Master Scholar):** 3,000 XP
- **Level 6 (Grandmaster):** 5,500 XP
