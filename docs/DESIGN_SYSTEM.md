# Design System Specification
## AI Smart Study Planner

**Version:** 1.0.0  
**Aesthetic Anchor:** Refined intersection of Notion's structured editorial clarity and Linear's engineering precision.  
**Platform Target:** Desktop Web, Tablet, Mobile Web, React Native (iOS & Android).

---

## 1. Design Philosophy & Core Principles

The AI Smart Study Planner rejects generic SaaS tropes (no gratuitous purple/cyan neon gradients, no over-blurred glassmorphism, no fake marketing banners, and no meaningless animated particles). Instead, it establishes an intentional, focused workspace tailored for intense academic concentration.

### Core Tenets:
1. **Content First, Chrome Second:** Navigation and toolbars retreat into fine 1px neutral borders, allowing course material, syllabi, and active notes to command full visual priority.
2. **Restrained, Purposeful Contrast:** High-contrast text on warm, paper-inspired light backgrounds (`#FAF9F6`) or deep architectural graphite dark surfaces (`#121316`).
3. **Muted Organic Accent:** A disciplined academic olive/forest green (`#2D5A27` in light mode, `#5B8C51` in dark mode) signals focus, active states, and verified completion without sensory fatigue.
4. **Predictable Geometry:** Consistent 6px/8px radii, 8px-based spacing rhythm, crisp 1px borders, and tactile keyboard-focusable states.
5. **Tabular Numerics for Time:** All countdown timers, session clocks, and XP totals use `font-variant-numeric: tabular-nums` to eliminate layout jitter.

---

## 2. Color System & Semantic Tokens

All colors are exposed as semantic CSS variables and TypeScript constants.

### 2.1 Palette Tokens

```text
Light Mode Palette:
  --bg-app:        #FAF9F6 (Warm Alabaster / Editorial Paper)
  --bg-surface:    #FFFFFF (Pure White Card / Panel)
  --bg-elevated:   #F3F2EE (Subtle Hover / Inset Wells)
  --border-subtle: #E8E7E1 (Fine structural separator)
  --border-strong: #D3D1C7 (Input border / active divider)
  --text-primary:  #191C1D (Deep Charcoal Ink)
  --text-muted:    #63686D (Secondary Metadata / Subheads)
  --text-subtle:   #92979D (Disabled / Placeholder)
  --accent-base:   #2D5A27 (Forest Focus Green)
  --accent-hover:  #24481F (Deep Forest Green)
  --accent-subtle: #EDF4EC (Soft Accent Wash)
  --warning-base:  #B57700 (Warm Ochre / Exam Approaching)
  --error-base:    #B3261E (Academic Crimson / Overdue / Weak)
  --success-base:  #1E7E34 (Verified Mastery / Perfect Quiz)

Dark Mode Palette:
  --bg-app:        #121316 (Deep Architectural Charcoal)
  --bg-surface:    #1A1C20 (Elevated Graphite Surface)
  --bg-elevated:   #23262C (Modal / Dropdown / Card Well)
  --border-subtle: #2A2E36 (Quiet structural line)
  --border-strong: #3D434E (Active border)
  --text-primary:  #EDEFEF (Crisp Off-White)
  --text-muted:    #9DA3AD (Secondary text)
  --text-subtle:   #686E78 (Muted labels)
  --accent-base:   #5B8C51 (Luminous Sage / Forest)
  --accent-hover:  #6EA363 (Lighter Sage)
  --accent-subtle: #1C271A (Dark Green Ambient Wash)
  --warning-base:  #E5A122 (Amber alert)
  --error-base:    #E0524C (Soft Coral Red)
  --success-base:  #4CAF50 (Mastery Green)
```

### 2.2 Subject Category Palette
For color-coding academic subjects in a restrained, accessible way:

| Subject Key | Light Token | Dark Token | Label | Contrast (WCAG AA) |
| :--- | :--- | :--- | :--- | :--- |
| `math` | `#1D4ED8` | `#60A5FA` | Sapphire Blue | 7.2:1 / 8.4:1 |
| `cs` | `#047857` | `#34D399` | Emerald Green | 6.8:1 / 7.9:1 |
| `physics` | `#B45309` | `#FBBF24` | Warm Amber | 5.5:1 / 9.1:1 |
| `chem` | `#B91C1C` | `#F87171` | Crimson | 6.2:1 / 8.0:1 |
| `humanities` | `#6D28D9` | `#A78BFA` | Deep Iris | 7.8:1 / 7.5:1 |
| `lang` | `#0E7490` | `#22D3EE` | Slate Teal | 6.4:1 / 8.2:1 |

---

## 3. Typography Scale

Primary Interface Typeface: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.  
Monospace / Code Typeface: `JetBrains Mono`, `Fira Code`, `ui-monospace`, `monospace`.

| Role | Size | Line Height | Weight | Letter Spacing | CSS Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Heading** | 32px (2.0rem) | 40px (1.25) | 600 SemiBold | -0.025em | `text-3xl font-semibold tracking-tight` |
| **Page Title** | 24px (1.5rem) | 32px (1.33) | 600 SemiBold | -0.02em | `text-2xl font-semibold tracking-tight` |
| **Section Header** | 18px (1.125rem) | 26px (1.44) | 600 SemiBold | -0.015em | `text-lg font-semibold` |
| **Card / Subhead** | 15px (0.9375rem)| 22px (1.46) | 500 Medium | -0.01em | `text-[15px] font-medium` |
| **Body (Default)** | 14px (0.875rem) | 20px (1.43) | 400 Regular | 0.0em | `text-sm leading-relaxed` |
| **UI Labels / Form**| 13px (0.8125rem)| 18px (1.38) | 500 Medium | +0.005em | `text-[13px] font-medium` |
| **Caption / Meta** | 12px (0.75rem) | 16px (1.33) | 400 Regular | +0.01em | `text-xs text-muted` |
| **Code / Tabular** | 13px (0.8125rem)| 20px (1.54) | 400 / 500 | 0.0em | `font-mono tabular-nums text-xs` |

---

## 4. Spacing, Radii & Elevation Tokens

### Spacing Scale (8-Point Grid)
```text
space-1:  4px   (Compact badge padding, icon gap)
space-2:  8px   (Button inline gap, form label margin)
space-3:  12px  (Card inner padding, input vertical padding)
space-4:  16px  (Standard component padding, list item separation)
space-6:  24px  (Section padding, modal padding)
space-8:  32px  (Page margin on tablet/mobile)
space-12: 48px  (Major dashboard module gap)
space-16: 64px  (Hero & layout boundary)
```

### Radius Tokens
- `radius-sm`: `4px` (Badges, tags, code snippets)
- `radius-md`: `6px` (Buttons, inputs, dropdown items)
- `radius-lg`: `10px` (Cards, panels, modal dialogs)
- `radius-full`: `9999px` (Pill status chips, avatars)

### Elevation & Shadow Rules
- In both light and dark modes, depth is conveyed through **1px border contrast** rather than diffuse blurry drop-shadows.
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.04)`
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`
- `shadow-modal`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

---

## 5. Component Patterns & States

### 5.1 Buttons
- **Primary:** Forest green background (`--accent-base`), crisp white text, 6px radius, hover tone shift, 2px focus ring with 2px offset.
- **Secondary:** Subtle border (`--border-strong`), surface background, text-primary, hover elevated.
- **Ghost:** Transparent background, muted text, hover background `--bg-elevated`.
- **Destructive:** Crimson tint with clear confirmation modal.
- **States:** Default, Hover, Active/Pressed, Focused (Visible 2px outline), Disabled (40% opacity, `cursor: not-allowed`), Loading (Spinner inside with disabled state).

### 5.2 Cards & Panels
- Clean 1px border (`--border-subtle`).
- Background: `--bg-surface`.
- Padding: 16px default, 20px for major metrics.
- Never use colorful rainbow gradient borders.

### 5.3 Form Inputs
- 1px border (`--border-strong`).
- Focus state: Border shifts to `--accent-base`, accompanied by a subtle 2px accent focus halo.
- Inline validation with descriptive, actionable error text.

### 5.4 Segmented Control & Tabs
- Integrated slider container with `--bg-elevated` well.
- Active pill with `--bg-surface`, 1px border, and subtle shadow.
- Immediate tab switching with no layout jump.

---

## 6. Accessibility & Motion Rules

1. **Contrast Standards:** Every text-to-background pairing strictly satisfies the 4.5:1 ratio for standard text and 3:1 for large text.
2. **Focus Management:** Every interactive control is keyboard-accessible with visible `focus-visible` styling (`outline: 2px solid var(--accent-base); outline-offset: 2px`).
3. **Motion Reductions:** All CSS transitions and Framer Motion effects wrap inside `@media (prefers-reduced-motion: reduce)`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
