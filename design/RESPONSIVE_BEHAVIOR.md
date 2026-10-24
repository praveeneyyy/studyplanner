# Responsive Behavior & Breakpoint Specifications
## AI Smart Study Planner

**Version:** 1.0.0  
**Design Standard:** Mobile-First Thinking with Desktop Density Optimization

---

## 1. Breakpoint System

```css
/* Tailwind CSS Standard Breakpoints */
sm:  640px   /* Large phones / Small phablets */
md:  768px   /* Tablets (iPad Mini / Portrait Tablets) */
lg:  1024px  /* Laptops / Tablet Landscape */
xl:  1280px  /* Standard Desktop */
2xl: 1536px  /* Large Displays / External Monitors */
```

---

## 2. Structural Layout Adaptations

| Module | Desktop ($\ge 1280\text{px}$) | Tablet ($768\text{px} - 1023\text{px}$) | Mobile ($< 768\text{px}$) |
| :--- | :--- | :--- | :--- |
| **Navigation** | Fixed 240px Sidebar | Icon-only 64px Sidebar or Drawer | Native Bottom Tab Bar (5 icons) |
| **Dashboard Grid** | 4-Column Stat Cards + 8:4 Main split | 2-Column Stat Cards + Stacked columns | 1-Column Cards, horizontal swipe strips |
| **Study Calendar** | 7-Day Time-Blocked Grid (07:00–22:00) | 3-Day Multi-Column View | Single-Day Agenda with Date Selector Bar |
| **AI Assistant** | Split Screen (Sidebar 280px + Chat 900px) | Collapsible Left Drawer + Chat | Full Screen with Header Sheet for History |
| **Study Workspace**| Side-by-Side (Timer Left + Notes/AI Right) | Stacked Tabs below Timer | Full-Screen Timer with Bottom Sheet Drawer |
| **Study Universe** | Full 3D Interactive WebGL Scene | 3D Scene with reduced particle count | Interactive 2D Node Map or Canvas fallback |

---

## 3. Form & Input Adaptations

1. **Stacking Behavior:** Multi-column inputs (e.g. Subject Name + Code + Priority) collapse into a single vertical column on viewports $< 768\text{px}$.
2. **Virtual Keyboard Handling:** On mobile devices, input sheets and the AI chat composer automatically float above the virtual keyboard without obscuring the most recent response.
3. **Touch Targets:** All clickable actions on mobile have minimum padding ensuring a $48 \times 48\text{ dp}$ hit area.
