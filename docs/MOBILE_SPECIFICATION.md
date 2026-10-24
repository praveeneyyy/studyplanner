# Native Mobile Application Specification
## AI Smart Study Planner (React Native / Expo)

**Version:** 1.0.0  
**Stack:** React Native 0.74+ / Expo SDK 51+ / Expo Router v3 / TypeScript / Reanimated 3  
**Platforms:** Android (API 26+) & iOS (iOS 15+)

---

## 1. Native Navigation Architecture

The mobile app implements a native tab hierarchy powered by Expo Router:

```text
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx            # Clean native login screen
│   │   └── register.tsx         # Account registration
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Native bottom tab bar with haptics
│   │   ├── index.tsx            # Home / Dashboard
│   │   ├── plan.tsx             # Daily & Weekly Agenda
│   │   ├── ai.tsx               # AI Academic Tutor Chat
│   │   ├── subjects.tsx         # Syllabus & Topic Navigator
│   │   └── profile.tsx          # Rewards, Streaks & Settings
│   ├── session/
│   │   └── [id].tsx             # Focused Study Timer & Workspace
│   ├── quiz/
│   │   └── [id].tsx             # Native Quiz Runner
│   └── _layout.tsx              # Root Stack with ThemeProvider & AuthGuard
```

### 1.1 Touch Ergonomics & Safe Areas
- All primary interactive elements maintain a minimum hit target of $48 \times 48\text{ dp}$.
- Crucial thumb-zone actions (Start Session, Ask AI, Complete Checklist) are positioned in the bottom half of the display.
- Implements `react-native-safe-area-context` to safely avoid notches, dynamic islands, and home indicator bars.

---

## 2. Screen-by-Screen Mobile Flows

### 2.1 Mobile Dashboard (`(tabs)/index.tsx`)
- **Primary Hero Card:** "What's Next" card displaying current/upcoming topic, scheduled duration, and an immediate 1-tap "Begin Session" CTA.
- **Exam Countdown Pill Strip:** Horizontally scrollable list of upcoming examinations with days-remaining indicators.
- **Daily Progress Arc:** Clean SVG ring showing completed minutes vs. daily goal.
- **Due Revisions Badge:** Quick tap jump to today's spaced repetition flashcards.

### 2.2 Mobile Study Planner (`(tabs)/plan.tsx`)
- **Segmented Header:** Toggle between `Today` (vertical time-blocked agenda) and `Week` (compact 7-day strip).
- **Session Card Interactions:**
  - Tap card: Opens native BottomSheet with objectives, duration, and topic summary.
  - Swipe right: Mark as `COMPLETED`.
  - Swipe left: Reschedule or bump to tomorrow.

### 2.3 Mobile AI Assistant (`(tabs)/ai.tsx`)
- Native chat stream using `KeyboardAvoidingView` with `behavior="padding"` on iOS and `"height"` on Android.
- Horizontal pill selector for the 16 answer formats (e.g. `2-Mark`, `5-Mark`, `Simple`, `Code`).
- Markdown formatting with syntax highlighting using native code views.

### 2.4 Active Study Session Workspace (`session/[id].tsx`)
- Distraction-free full-screen layout.
- High-contrast timer with start/pause/resume actions.
- Topic objectives checklist with tactile haptic checkmarks.
- Upon completion, triggers `expo-haptics` success vibration and displays XP earned modal.

---

## 3. Local Notifications & Background Reminders

Using `expo-notifications`, scheduled local alerts notify students of upcoming commitments:
1. **15-Minute Session Warning:** "Your study block on *Virtual Memory* begins in 15 minutes."
2. **Daily Morning Briefing (08:30):** "Today you have 3 sessions planned (2.5h total) and 4 revision items due."
3. **Quiet Hours Enforcement:** Notifications are silenced between the user's declared quiet hours (default: 22:00 to 08:00).

---

## 4. Offline Persistence & Synchronization

1. **Read-Only Cache:** All active study plans, syllabus topics, and recent notes are cached in `AsyncStorage` via TanStack Query's `persistQueryClient`.
2. **Offline Mode Banner:** If the device loses internet connection, a quiet top indicator states: *"Working offline. Changes will sync when reconnected."*
3. **Optimistic Updates:** Session checklist completions and recall ratings update locally first, queuing a background sync payload.
