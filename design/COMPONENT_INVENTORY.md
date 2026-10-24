# Component Inventory & Design Tokens
## AI Smart Study Planner

**Version:** 1.0.0  
**Scope:** Universal Design Components for Web (`apps/web`) and Mobile (`apps/mobile`)

---

## 1. Core Atomic Controls

### 1.1 Buttons (`<Button />`)
- **Variants:**
  - `primary`: Forest green fill, white text, 6px radius.
  - `secondary`: Clean 1px border (`--border-strong`), surface fill, text-primary.
  - `ghost`: Transparent fill, muted text, subtle hover well.
  - `destructive`: Crimson border/text, modal verification required.
- **Sizes:**
  - `sm`: Height 32px, text 12px, padding 8px 12px.
  - `md`: Height 40px, text 14px, padding 10px 16px.
  - `lg`: Height 48px, text 15px, padding 12px 20px (Mobile thumb primary).

### 1.2 Badges & Status Chips (`<Badge />`)
- **Mastery Status:** `Mastered` (Green fill wash), `Developing` (Amber wash), `Needs Attention` (Red wash).
- **Exam Countdown Pill:** `12 days left` with urgent styling when $\le 3$ days.
- **Difficulty Pill:** Numeric dots `●●●○○` indicating 1–5 scale.

---

## 2. Academic Domain Components

### 2.1 Study Session Card (`<StudySessionCard />`)
- **Structure:**
  - Left indicator: Subject color strip (`4px` vertical bar).
  - Main area: Topic title, unit name, scheduled time block (`09:00 - 09:45`).
  - Right area: Duration badge (`45m`), Session Type (`LEARN` / `REVISE`), and Status action button (`Start` / `Done`).
- **Interactive States:** Default, Hover elevation, Active focus, Drag-to-reschedule handle on web.

### 2.2 AI Chat Message Bubble (`<AIChatBubble />`)
- **Assistant Message:**
  - Header: Provider badge (`IBM watsonx` or `Academic Demo Tutor`), format badge (`5-Mark University Answer`), copy button.
  - Body: Rich Markdown rendering, highlighted syntax for code blocks, LaTeX math blocks.
  - Footer Action Bar: `[Save to Notes]`, `[Generate 5-Q Quiz]`, `[Make Flashcards]`, `[Retry]`.

### 2.3 Interactive Spaced Repetition Card (`<FlashcardCard />`)
- **Card Flip Interaction:** 3D flip transform revealing question on front and answer on back.
- **Recall Action Matrix:** 4 buttons:
  - `Again (1)`: Red tint, resets interval to 1 day.
  - `Hard (2)`: Amber tint.
  - `Good (3)`: Soft sage tint, expands interval by ease factor.
  - `Easy (4)`: Emerald tint, maximum interval leap.

### 2.4 Interactive Quiz Question Runner (`<QuizRunner />`)
- Progress bar (`Question 3 of 5`).
- Option selector: 4 choices with keyboard shortcuts (`1`, `2`, `3`, `4` or `A`, `B`, `C`, `D`).
- Upon selection: Immediate validation highlighting correct answer in green, incorrect selection in red, and sliding open the detailed academic explanation.

---

## 3. Feedback & Navigation

### 3.1 Sidebar (Web Desktop)
- Fixed or collapsible navigation containing: Brand Header, Navigation Links (Dashboard, Subjects, Calendar, AI Tutor, Universe, Revision, Quizzes, Rewards), and Bottom User Profile with Theme Toggle.

### 3.2 Bottom Tab Bar (Mobile)
- 5 primary destinations: Home, Plan, AI, Subjects, Profile.
- Tactile haptic feedback on tab change.
- Safe-area bottom inset padding.
