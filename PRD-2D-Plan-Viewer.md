# Product Requirements Document (PRD)

## Spacial.io - 2D Plan Viewer

| Field | Value |
|-------|-------|
| **Document Version** | 1.0 |
| **Date** | March 1, 2026 |
| **Assignment Duration** | 90 minutes |
| **Deployment Target** | GitHub Pages |

---

## 1. Overview

### 1.1 Purpose
This document defines the requirements for building a **2D architectural plan viewer** application. The viewer will display a foundation plan image and provide interactive navigation capabilities with real-time action logging.

### 1.2 Scope
- **Frontend-only application** (no backend required)
- Built using **React** (or another frontend framework)
- Single-page application with viewer and action log components
- Deployable to GitHub Pages

### 1.3 Plan Image Reference
The viewer will display the provided **Foundation Plan** image, which includes:
- Building foundation layout with room divisions
- Garage area (upper left section)
- Crawl space areas with notations
- Grid reference markers (A-M horizontal, 1-7 vertical)
- Dimensional annotations and construction details
- Scale reference: 1/4" = 1'-0"

![Foundation Plan](Images/Screenshot%202026-01-11%20at%2021.01.08.png)

---

## 2. Functional Requirements

### 2.1 Viewer Component

#### 2.1.1 Image Display
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| VW-001 | Display the foundation plan image inside a dedicated viewer area | Must Have |
| VW-002 | Image must be contained within the viewer boundaries initially | Must Have |
| VW-003 | Viewer area should be responsive and occupy the left portion of the screen | Must Have |

#### 2.1.2 Zoom Functionality
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| ZM-001 | Enable zoom in/out using mouse wheel or trackpad scroll | Must Have |
| ZM-002 | Zoom must be centered on the cursor position (not viewport center) | Must Have |
| ZM-003 | Minimum zoom level: **0.25x** (25% of original size) | Must Have |
| ZM-004 | Maximum zoom level: **5x** (500% of original size) | Must Have |
| ZM-005 | Zoom transitions should be smooth and responsive | Should Have |

**Zoom Behavior:**
```
User Action: Mouse wheel scroll up    → Zoom In (toward cursor position)
User Action: Mouse wheel scroll down  → Zoom Out (from cursor position)
Constraint:  0.25x ≤ zoom level ≤ 5x
```

#### 2.1.3 Pan Functionality
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| PN-001 | Enable panning via click-and-drag interaction | Must Have |
| PN-002 | Mouse down initiates pan mode | Must Have |
| PN-003 | Mouse drag moves the image in the drag direction | Must Have |
| PN-004 | Mouse release stops panning | Must Have |
| PN-005 | Cursor should change to "grab" on hover and "grabbing" while dragging | Should Have |

**Pan Behavior:**
```
User Action: Mouse down  → Enter pan mode
User Action: Mouse drag  → Translate image by (deltaX, deltaY)
User Action: Mouse up    → Exit pan mode
```

#### 2.1.4 View Reset
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| RS-001 | Double-click anywhere in the viewer resets the view | Must Have |
| RS-002 | Reset action centers the image in the viewer | Must Have |
| RS-003 | Reset action restores zoom level to default (1x or fit-to-view) | Must Have |

---

### 2.2 Action Log Component

#### 2.2.1 Layout
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| LG-001 | Display action log as a table beside the viewer (side-by-side layout) | Must Have |
| LG-002 | Action log should be positioned on the right side of the screen | Must Have |
| LG-003 | Log should be scrollable when entries exceed visible area | Should Have |

#### 2.2.2 Logged Actions
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| LG-004 | Log **Zoom In** events in real-time | Must Have |
| LG-005 | Log **Zoom Out** events in real-time | Must Have |
| LG-006 | Log **Pan** events (either start+end or single entry with delta) | Must Have |
| LG-007 | Log **Center Reset** events (double-click) | Must Have |

#### 2.2.3 Log Entry Format
Each log entry **must include**:

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **Timestamp** | Time when the action occurred | ✅ Yes | `14:32:15.234` |
| **Action Type** | Type of user interaction | ✅ Yes | `Zoom In`, `Zoom Out`, `Pan`, `Reset` |

**Bonus Fields** (Optional but recommended):

| Field | Description | Example |
|-------|-------------|---------|
| **Zoom Level** | Current zoom multiplier | `2.5x` |
| **Pan Delta** | Movement offset (x, y) | `(+120, -45)` |
| **Details** | Additional context | `Reset to center` |

---

## 3. Non-Functional Requirements

### 3.1 Performance
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| PF-001 | Zoom/pan interactions must feel smooth (60fps target) | Should Have |
| PF-002 | Action logging must not impact viewer performance | Must Have |

### 3.2 Usability
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| UX-001 | Intuitive interaction patterns (standard zoom/pan conventions) | Must Have |
| UX-002 | Visual feedback during interactions (cursor changes, etc.) | Should Have |

### 3.3 Compatibility
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| CP-001 | Support modern browsers (Chrome, Firefox, Safari, Edge) | Must Have |
| CP-002 | Support both mouse and trackpad input | Must Have |

### 3.4 Deployment
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| DP-001 | Application must be deployable to GitHub Pages | Must Have |
| DP-002 | Static site with no server-side dependencies | Must Have |

---

## 4. User Interface Design

### 4.1 Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         2D Plan Viewer - Spacial.io                      │
├────────────────────────────────────────┬─────────────────────────────────┤
│                                        │          ACTION LOG             │
│                                        ├─────────────────────────────────┤
│                                        │ Timestamp  │ Action   │ Details │
│                                        ├────────────┼──────────┼─────────┤
│          ┌─────────────────────┐       │ 14:32:15   │ Zoom In  │ 1.5x    │
│          │                     │       │ 14:32:18   │ Pan      │ +50,-20 │
│          │   FOUNDATION PLAN   │       │ 14:32:25   │ Zoom Out │ 1.2x    │
│          │       (Image)       │       │ 14:32:30   │ Reset    │ Center  │
│          │                     │       │ 14:32:45   │ Zoom In  │ 2.0x    │
│          └─────────────────────┘       │     ...    │   ...    │  ...    │
│                                        │            │          │         │
│         [Zoomable & Pannable]          │            │          │         │
│                                        │            │          │         │
├────────────────────────────────────────┴─────────────────────────────────┤
│  Zoom: 1.5x  │  Status: Ready  │  Hint: Double-click to reset view       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Interaction States

| State | Cursor | Description |
|-------|--------|-------------|
| Default | `default` | Normal state, ready for interaction |
| Hover over image | `grab` | Indicates image can be panned |
| Panning | `grabbing` | Actively dragging the image |
| Zooming | `zoom-in` / `zoom-out` | During zoom interaction |

### 4.3 Visual Design Requirements 🎨

#### 4.3.1 Color Scheme & Style
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| VS-001 | Use a **modern, polished design** aesthetic | Must Have |
| VS-002 | Implement **gradient colors in blue and white hues** as the primary color palette | Must Have |
| VS-003 | Use clean, modern **typography** (e.g., Inter, Poppins, or system fonts) | Must Have |
| VS-004 | Include **plenty of emoji** 🎯 throughout the UI to add personality | Must Have |
| VS-005 | Implement smooth **hover effects** on interactive elements to bring the UI to life | Must Have |

**Color Palette Suggestion:**
```
Primary Gradient:    #3B82F6 → #1D4ED8 (Sky Blue → Royal Blue)
Secondary Gradient:  #60A5FA → #93C5FD (Light Blue → Soft Blue)
Accent:              #2563EB (Vibrant Blue)
Dark Mode BG:        #0F172A → #1E293B (Slate)
Light Mode BG:       #FFFFFF → #F0F9FF (White → Ice Blue)
```

#### 4.3.2 Header & Navigation 🧭
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| HD-001 | Include a **visually appealing header** with the application title/logo | Must Have |
| HD-002 | Header should include **navigation elements** if needed | Should Have |
| HD-003 | Header should have subtle gradient or styled background | Should Have |
| HD-004 | Navigation items should have hover animations | Should Have |

#### 4.3.3 Footer 📋
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| FT-001 | Include a **footer** at the bottom of the page | Must Have |
| FT-002 | Footer should contain **standard links** (About, Contact, GitHub, etc.) | Must Have |
| FT-003 | Footer should display **copyright information** (© 2026 Spacial.io) | Must Have |
| FT-004 | Footer styling should match the overall theme | Should Have |

#### 4.3.4 Responsive Design 📱💻
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| RS-001 | Site must be **fully responsive** and work on all screen sizes | Must Have |
| RS-002 | Optimize layout for **desktop** (side-by-side viewer + log) | Must Have |
| RS-003 | Optimize layout for **mobile** (stacked layout, touch-friendly) | Must Have |
| RS-004 | Use CSS breakpoints for smooth transitions between layouts | Should Have |

**Responsive Breakpoints:**
```
Mobile:     < 768px   (Stacked layout, log below viewer)
Tablet:     768px - 1024px (Compact side-by-side)
Desktop:    > 1024px  (Full side-by-side layout)
```

#### 4.3.5 Light & Dark Mode 🌓
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| TH-001 | Support both **light mode** and **dark mode** | Must Have |
| TH-002 | Include a **theme toggle button** (e.g., 🌙/☀️ icon) | Must Have |
| TH-003 | Theme preference should persist (localStorage) | Should Have |
| TH-004 | Respect system preference on first visit | Should Have |
| TH-005 | Smooth transition animation when switching themes | Should Have |

**Theme Specifications:**

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#FFFFFF` / `#F0F9FF` | `#0F172A` / `#1E293B` |
| Text | `#1E293B` | `#F8FAFC` |
| Primary Accent | `#2563EB` | `#3B82F6` |
| Card/Panel BG | `#FFFFFF` | `#1E293B` |
| Border | `#BFDBFE` | `#334155` |

#### 4.3.6 Key Features Highlighting ✨
| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| KF-001 | **Visually highlight** the key features of the application | Must Have |
| KF-002 | Use visual hierarchy to draw attention to important UI elements | Should Have |
| KF-003 | Consider feature badges, icons, or callout boxes | Should Have |
| KF-004 | Use subtle animations to emphasize interactive elements | Should Have |

**UI Enhancement Ideas:**
- 🔍 Zoom controls with animated icons
- ↔️ Pan indicator with directional arrows
- 📊 Animated log entries (fade-in effect)
- ⚡ Quick action tooltips on hover
- 🎯 Pulsing reset button hint

---

## 5. Technical Specifications

### 5.1 Recommended Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | React 18+ | Functional components with hooks |
| Language | TypeScript (optional) | Recommended for type safety |
| Styling | Tailwind CSS / CSS Modules | Utility-first for rapid styling |
| Icons/Emoji | Native emoji + React Icons | 🎨 For visual flair |
| Theme Management | CSS Variables + Context | Easy light/dark mode switching |
| Build Tool | Vite | Fast development & build |
| Deployment | GitHub Pages | Via `gh-pages` package |

### 5.2 Key Implementation Notes

#### Cursor-Centered Zoom Algorithm
```javascript
// Pseudocode for cursor-centered zoom
function handleZoom(wheelDelta, cursorX, cursorY) {
  const zoomFactor = wheelDelta > 0 ? 1.1 : 0.9;
  const newScale = clamp(scale * zoomFactor, 0.25, 5);
  
  // Adjust position to keep cursor point stationary
  const scaleChange = newScale / scale;
  offsetX = cursorX - (cursorX - offsetX) * scaleChange;
  offsetY = cursorY - (cursorY - offsetY) * scaleChange;
  
  scale = newScale;
}
```

#### Performance Tips
- Use CSS `transform: scale() translate()` for hardware acceleration
- Debounce/throttle wheel events if needed
- Use `will-change: transform` for smoother animations
- Consider `requestAnimationFrame` for pan updates

---

## 6. Acceptance Criteria

### 6.1 Core Requirements (Must Pass) ✅
- [ ] Foundation plan image is displayed in viewer area
- [ ] Mouse wheel zoom works and is centered on cursor position
- [ ] Zoom is constrained between 0.25x and 5x
- [ ] Click-and-drag panning works correctly
- [ ] Double-click resets the view to center
- [ ] Action log displays all interactions with timestamps
- [ ] Side-by-side layout (viewer left, log right)

### 6.2 Design & Styling Requirements (Must Pass) 🎨
- [ ] Modern UI with blue/white gradient color scheme
- [ ] Clean, modern typography throughout
- [ ] Emoji elements integrated into the UI
- [ ] Hover effects on interactive elements
- [ ] Styled header with navigation
- [ ] Footer with standard links and copyright
- [ ] Responsive layout (desktop + mobile)
- [ ] Light and dark mode with toggle switch

### 6.3 Bonus Features (Nice to Have) ⭐
- [ ] Detailed action log with zoom levels and pan deltas
- [ ] Smooth zoom/pan animations with easing
- [ ] Visual cursor feedback (grab/grabbing)
- [ ] Current zoom level display in UI
- [ ] Keyboard shortcuts (+/- for zoom, R for reset)
- [ ] Clear log button
- [ ] Theme persistence (localStorage)
- [ ] Animated transitions between themes
- [ ] Feature highlight badges/callouts

---

## 7. Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Source Code** | Complete React application |
| 2 | **README.md** | Setup instructions, features, usage |
| 3 | **Live Demo** | Deployed on GitHub Pages |
| 4 | **(Optional) Documentation** | Brief implementation notes |

---

## 8. Timeline Breakdown ⏱️

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Setup** | 10 min | Create React app, install dependencies, project structure |
| **Viewer Core** | 35 min | Image display, zoom (with cursor centering), pan, reset |
| **Action Log** | 20 min | Log component, state management, event logging |
| **Styling & Theme** | 15 min | Blue/white gradients, header/footer, light/dark mode toggle |
| **Polish & Deploy** | 10 min | Responsive tweaks, testing, GitHub Pages deployment |
| **Total** | **90 min** | |

> 💡 **Tip:** Focus on core functionality first, then layer in styling. Use CSS variables for easy theming.

---

## 9. Out of Scope

The following features are explicitly **not required** for this assignment:
- Backend/API integration
- User authentication
- Multiple plan support
- Annotations or markup tools
- Touch gestures (pinch-to-zoom, swipe pan)
- Measurement tools
- Print functionality

---

## Appendix A: Reference Image

**File:** `Images/Screenshot 2026-01-11 at 21.01.08.png`

The foundation plan shows a residential building foundation with:
- Multiple room divisions and structural elements
- Grid system for architectural reference (columns A-M, rows 1-7)
- Garage slab notation (upper-left quadrant)
- Crawl space areas with specifications
- Detailed dimensional callouts
- Scale: 1/4" = 1'-0"

---

*End of Document*
