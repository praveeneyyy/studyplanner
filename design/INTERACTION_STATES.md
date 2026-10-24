# Interaction States, Empty States & Error Recovery
## AI Smart Study Planner

**Version:** 1.0.0  
**Design Standard:** Never leave the user wondering: "Did my action register?", "What should I do next?", or "Why did this fail?"

---

## 1. Global Component State Standards

Every interactive element implements 6 discrete states:

```text
1. Default:       Base surface, 1px border, high-contrast readable text.
2. Hover:         Subtle lightness shift (+4% in dark, -4% in light), cursor: pointer.
3. Active/Press:  Scale transform down to 0.98, immediate tactile response.
4. Focus Visible: 2px solid var(--accent-base) with 2px offset (WCAG AA compliant).
5. Disabled:      Opacity 40%, cursor: not-allowed, pointer-events: none.
6. Loading:       Embedded spinner or skeleton shimmer, retaining fixed layout dimensions.
```

---

## 2. Empty States with Actionable Guidance

Never render blank white space. Every empty view provides context, encouragement, and a clear primary action button:

| Screen | Empty State Trigger | Visual / Copy | Direct Action CTA |
| :--- | :--- | :--- | :--- |
| **Dashboard** | New account with 0 subjects | "Your study workspace is clear. Add your first subject to begin building your custom exam schedule." | `[Add Subject & Syllabus]` |
| **Study Planner** | No active plan generated | "No study plan detected for your upcoming exams. Let our scheduling engine map out your days." | `[Generate Adaptive Plan]` |
| **Revision Hub** | All due flashcards reviewed | "You're completely caught up! All scheduled spaced repetitions for today have been completed." | `[Explore New Topics]` |
| **Weak Topics** | All topic mastery $\ge 70\%$ | "No critical knowledge gaps found. Keep up your active study streak!" | `[Take Practice Mock Exam]` |
| **Notes** | 0 notes saved | "You haven't saved any study notes yet. Use the AI Tutor or write your own key concepts." | `[Create First Note]` |

---

## 3. Error Recovery & Fallback Flows

1. **Infeasible Study Schedule (Overload Warning):**
   - *Message:* "You have 34 hours of remaining topics but only 18 hours of available study time before your Operating Systems exam on Nov 20."
   - *Options Provided:*
     - A: "Increase daily study availability from 2h to 3.5h."
     - B: "Focus only on High-Priority units (Units 1, 2, and 4)."
2. **AI Provider Failure / Offline:**
   - *Message:* "External AI service is temporarily unreachable. Switching to the verified Academic Curriculum engine."
   - *Option Provided:* Seamlessly renders verified textbook-standard responses with an explanatory badge.
3. **Session Interruption Recovery:**
   - If the user accidentally closes the tab or refreshes during an active 45-minute session, the elapsed time is persisted in `localStorage` and restored immediately upon reload.
