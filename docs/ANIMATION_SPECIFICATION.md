# Animation & Micro-Interaction Specification
## AI Smart Study Planner

**Version:** 1.0.0  
**Libraries:** Framer Motion (Web) & React Native Reanimated 3 (Mobile)  
**Standard:** 60fps on modern mobile and desktop hardware; strict adherence to `prefers-reduced-motion`.

---

## 1. Motion Tokens & Easing Curves

All interface animations share unified timing tokens defined in `@ai-study/design-tokens`:

```typescript
export const motionTokens = {
  duration: {
    instant: 100, // Tooltips, button press feedback
    fast: 150,    // Dropdowns, checkmark pop, pill tab switch
    normal: 250,  // Sidebar collapse, modal dialog entrance, cards
    slow: 400,    // Full page transitions, sheet slide-in
    deliberate: 700 // Level-up particle celebration, progress ring fill
  },
  easing: {
    standard: [0.2, 0.0, 0.0, 1.0], // cubic-bezier(0.2, 0, 0, 1) - Linear-style decelerate
    enter: [0.0, 0.0, 0.2, 1.0],    // Elements entering viewport
    exit: [0.4, 0.0, 1.0, 1.0],     // Elements exiting viewport
    spring: { damping: 20, stiffness: 300 } // Tappable interactive bounce
  }
};
```

---

## 2. Component Micro-Interactions

### 2.1 Study Session Checklist Pop
When a student checks an objective item:
- Checkbox container scales down to `0.92` on tap, then springs to `1.08`, settling at `1.0`.
- The SVG checkmark animates with `pathLength` from `0` to `1` over `150ms`.
- Strikethrough line extends smoothly across topic text (`duration: 200ms`).

### 2.2 XP Counter & Progress Bar Sweep
When an action grants XP (e.g. +25 XP):
- The XP number rolls up smoothly using a numeric ticker animation over `450ms`.
- The progress bar fill width transitions with `cubic-bezier(0.2, 0, 0, 1)`.
- A tiny floating pill `+25 XP` floats upward by `20px` and fades out over `600ms`.

### 2.3 Sidebar Collapse / Expand (Desktop)
- Smooth width animation between `240px` (expanded) and `64px` (collapsed).
- Text labels fade out with opacity before layout width shrinks, avoiding text wrapping or horizontal clipping.

### 2.4 Modal Dialog Entrance
- Backdrop fades in from `opacity: 0` to `opacity: 1` (`200ms`).
- Dialog surface scales from `0.96` to `1.0` with `translateY(8px)` to `translateY(0)` (`250ms`).

---

## 3. Reduced Motion Compliance

For users with vestibular disorders or `prefers-reduced-motion: reduce`:
- All spatial movement (`translateY`, scale transforms) is deactivated.
- Transitions default to an instantaneous or gentle `opacity` fade (`100ms`).
- Three.js particle speeds freeze to static positioning.
