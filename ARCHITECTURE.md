# 2D Plan Viewer — Architecture & Interview Preparation

This document explains every decision made when building this application.
Use it to confidently discuss the project in a technical interview.

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [Technology Stack & Why](#2-technology-stack--why)
3. [Project Structure](#3-project-structure)
4. [Component Architecture](#4-component-architecture)
5. [State Management Strategy](#5-state-management-strategy)
6. [Key Implementation Details](#6-key-implementation-details)
7. [Styling Architecture](#7-styling-architecture)
8. [Build & Deployment Pipeline](#8-build--deployment-pipeline)
9. [TypeScript Design](#9-typescript-design)
10. [Performance Decisions](#10-performance-decisions)
11. [Potential Interview Questions & Answers](#11-potential-interview-questions--answers)

---

## 1. What the App Does

**2D Plan Viewer** is a browser-based interactive viewer for architectural floor plan images.

### Core User Features
- **Scroll-to-zoom** — uses the mouse wheel to zoom in and out on the plan image
- **Click-and-drag panning** — holds and drags to navigate around the plan
- **Double-click to reset** — instantly re-centers and fits the plan to the viewport
- **Real-time Action Log** — every interaction is recorded with a precise timestamp and displayed in a sidebar table
- **Light / Dark theme** — user preference is remembered in `localStorage` across sessions
- **Responsive layout** — adapts from a side-by-side desktop layout to a stacked mobile layout

### The Problem It Solves
Architectural plan images are large and contain a lot of detail.
A native `<img>` tag cannot be zoomed or panned without third-party plugins.
This app delivers that UX in pure React with no external viewer library.

---

## 2. Technology Stack & Why

| Technology | Version | Role | Why Chosen |
|---|---|---|---|
| **React** | 18.3 | UI framework | Industry standard, hooks-first, excellent performance for this kind of interactive UI |
| **TypeScript** | 5.6 | Type safety | Catches errors at compile time, makes refactoring safe, documents intent in function signatures |
| **Vite** | 6.0 | Build tool & dev server | Extremely fast HMR (Hot Module Replacement) compared to Webpack; native ES modules in dev |
| **CSS Variables** | — | Theming | No runtime JS cost for theme switching; native browser feature; no library needed |
| **gh-pages** | 6.3 | Deployment | One command deploys the built output to GitHub Pages; perfect for a static frontend app |

### What Was Intentionally Left Out
- **No Redux / Zustand / Jotai** — The app has only three shared state values (`theme`, `logs`, `nextId`). Global state libraries add boilerplate with zero benefit at this scale.
- **No UI component library (MUI, Ant Design, etc.)** — The entire interface is simple enough that hand-written CSS is faster to iterate on and produces a lighter bundle.
- **No testing library** — This was a focused assignment build. Tests would be the obvious next step (see section 11).
- **No backend** — The app is purely static: there is no server, no database, no API calls. The data is a single image file that ships with the app.

---

## 3. Project Structure

```
2D-plan-viewer/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← CI/CD: builds and deploys on every push to main
├── plan-viewer/              ← The React application (create-vite scaffold)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── foundation-plan.png  ← The static plan image asset
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActionLog.tsx    ← Sidebar table showing user interaction history
│   │   │   ├── Footer.tsx       ← Page footer (copyright, links)
│   │   │   ├── Header.tsx       ← Top bar with logo, GitHub link, theme toggle
│   │   │   └── PlanViewer.tsx   ← The core zoom/pan image viewer
│   │   ├── App.tsx              ← Root component; owns global state
│   │   ├── main.tsx             ← React entry point (ReactDOM.createRoot)
│   │   ├── types.ts             ← Shared TypeScript interfaces
│   │   ├── index.css            ← All styles; CSS variable-based theme system
│   │   └── vite-env.d.ts        ← Vite type declarations (import.meta.env)
│   ├── index.html               ← HTML shell; loads Google Fonts + React bundle
│   ├── vite.config.ts           ← Vite config (base path for GitHub Pages)
│   ├── tsconfig.json            ← TypeScript compiler config
│   └── package.json             ← Dependencies and scripts
└── ARCHITECTURE.md              ← This document
```

**Why this structure?**
Vite scaffolds this layout automatically with `npm create vite`.
The `components/` folder holds one file per component — a flat structure that is easy to navigate in a small app.
As an app grows you would add feature-based sub-folders (e.g. `components/viewer/`, `components/log/`).

---

## 4. Component Architecture

### Component Tree

```
App                          ← Global state owner
├── Header                   ← Receives: theme, toggleTheme()
├── div.main-content         ← CSS flexbox row (or column on mobile)
│   ├── PlanViewer           ← Receives: addLog()
│   └── ActionLog            ← Receives: logs[], onClear()
└── Footer                   ← No props (pure presentational)
```

### Responsibility of Each Component

#### `App.tsx` — The State Root
Owns all shared state that multiple components need.
Does not render any visible UI elements directly beyond layout wrappers.
Exposes callbacks (`addLog`, `toggleTheme`, `clearLogs`) to children via props.

#### `Header.tsx` — Pure Presentational + one action
Receives `theme` and `toggleTheme` as props.
Renders the gradient header bar, logo, GitHub link, and the theme toggle button.
Does not hold any local state.

#### `PlanViewer.tsx` — The Core Feature
The most complex component in the app.
Manages its own local state for `scale`, `position`, and `isPanning` because these values are only needed here — no other component cares about the current zoom level.
Calls `addLog` when an interaction completes so the parent can record it.

#### `ActionLog.tsx` — Pure Presentational
Receives `logs[]` and `onClear` from App.
Renders a scrollable table with colour-coded badges for each action type.
Contains no business logic; it only formats and displays the data it receives.

#### `Footer.tsx` — Static
Contains no props and no state.
Renders copyright information and navigation links.

### Data Flow Summary

```
User scrolls (wheel event)
    ↓
PlanViewer.handleWheel()       [updates local scale + position state]
    ↓
props.addLog('Zoom In', '🔍 1.25x')
    ↓
App.addLog()                   [prepends new LogEntry to logs array]
    ↓
ActionLog re-renders            [new row animates in at the top of the table]
```

---

## 5. State Management Strategy

### Why Not Redux?

Redux solves the problem of sharing state across many components that are far apart in the component tree (a.k.a. "prop drilling").
This app has a shallow, predictable tree. Passing `addLog` one level deep to `PlanViewer` is not prop drilling — it is the correct React idiom.
Adding Redux would mean writing actions, reducers, a store, and a provider for a three-field state object. That is over-engineering for this scope.

### State Location Decisions

| State | Held In | Why |
|---|---|---|
| `theme` | `App` | Both `Header` (toggle button) and `body` attribute need it |
| `logs` | `App` | Both `PlanViewer` (writes) and `ActionLog` (reads) need it |
| `nextId` | `App` | Co-located with `logs` because they change together |
| `scale` | `PlanViewer` | Only the viewer reads and updates this |
| `position` | `PlanViewer` | Only the viewer reads and updates this |
| `isPanning` | `PlanViewer` | Only the viewer needs to know if a drag is in progress |

### Refs vs State in PlanViewer

`PlanViewer` uses a pattern where some values exist as **both** `useState` and `useRef`:

```typescript
const [scale, setScale] = useState(1)
const scaleRef = useRef(1)

useEffect(() => { scaleRef.current = scale }, [scale])
```

**Why?**
The wheel event listener is attached imperatively with `addEventListener`.
If the handler function was recreated every render, it would need to be removed and re-added on every render.
To avoid this, the handler is wrapped in `useCallback` with an empty dependency array so it is created only once.
But a handler created only once has a "stale closure" — it forever sees the value of `scale` from when it was first created.
The `ref` solves this: the handler always reads `scaleRef.current`, which is kept up to date by the `useEffect`.

---

## 6. Key Implementation Details

### 6.1 Cursor-Centred Zoom

The most technically interesting piece. When you scroll over a point, that point stays stationary — the view expands/contracts around your cursor.

```typescript
const delta = -e.deltaY * ZOOM_SENSITIVITY   // convert scroll direction to scale delta
const zoomFactor = 1 + delta
let newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentScale * zoomFactor))

const scaleChange = newScale / currentScale
// The cursor's position relative to the image must stay the same after scaling:
// newX = cursorX - (cursorX - oldX) * scaleChange
const newX = cursorX - (cursorX - currentPos.x) * scaleChange
const newY = cursorY - (cursorY - currentPos.y) * scaleChange
```

**The maths:** If the cursor is at `cursorX` in the container and the image left edge is at `pos.x`, then the cursor is at `(cursorX - pos.x)` pixels from the image edge. After scaling, the image edge must be at `cursorX - (cursorX - pos.x) * scaleChange` so that the same image pixel stays under the cursor.

### 6.2 Fit-to-Screen on Load

When the image loads, the viewer calculates the scale that makes it 90% of the viewport:

```typescript
const scaleX = container.width / img.naturalWidth
const scaleY = container.height / img.naturalHeight
const fitScale = Math.min(scaleX, scaleY) * 0.9   // 90% to leave breathing room
```

`Math.min` is used so the entire image is always visible (letterbox behaviour, not crop behaviour).
The `* 0.9` leaves a small visual margin around the image.
The same logic is called on double-click to reset the view.

### 6.3 Pan — Global Mouse-Up Listener

```typescript
useEffect(() => {
  const handleGlobalMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      addLog('Pan', ...)
    }
  }
  window.addEventListener('mouseup', handleGlobalMouseUp)
  return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
}, [isPanning, addLog])
```

If the user clicks inside the viewer but releases the mouse outside the browser window, a `mouseup` event on the container never fires. Without the global listener, the app would get stuck in panning mode. Attaching to `window` catches the event regardless of where the mouse is released.

### 6.4 CSS Transform vs Canvas

The image is moved and scaled using a CSS `transform`:

```
transform: translate(${x}px, ${y}px) scale(${scale})
```

**Why not Canvas?** Canvas requires manual redrawing and pixel management. CSS transforms are hardware-accelerated by the browser's compositor thread — zero JavaScript involved during the animation, resulting in 60fps performance even on low-end hardware.

**Why not `transform-origin: center`?** The image uses `transform-origin: 0 0` (top-left corner). This simplifies the mathematics because position coordinates are the absolute pixel offset of the top-left corner, not the center.

### 6.5 `passive: false` on the Wheel Event

```typescript
el.addEventListener('wheel', handleWheel, { passive: false })
```

Since Chrome 73, scroll event listeners are `passive: true` by default for performance (it allows the browser to start scrolling immediately without waiting for the handler to finish). But `passive: true` means you cannot call `e.preventDefault()`. Without `preventDefault()`, the browser would scroll the page _and_ zoom the image simultaneously. `passive: false` opts back in to allow `preventDefault()` to block the page scroll.

### 6.6 Millisecond-Precision Timestamps

```typescript
const timestamp =
  now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  + '.' + String(now.getMilliseconds()).padStart(3, '0')
// → "14:32:45.123"
```

When a user rapidly scrolls, many zoom events fire within a single second. Second-precision would show identical timestamps for consecutive entries, making the log harder to reason about. Milliseconds make the timing of each interaction clear.

---

## 7. Styling Architecture

### CSS Variables for Theming

All colours are declared as CSS custom properties on the `:root` selector (light mode) and overridden on `[data-theme="dark"]`:

```css
:root {
  --bg-primary: #F0F9FF;
  --text-primary: #1E293B;
  /* ... */
}

[data-theme="dark"] {
  --bg-primary: #0F172A;
  --text-primary: #F8FAFC;
  /* ... */
}
```

Switching theme is a single JavaScript call:
```typescript
document.documentElement.setAttribute('data-theme', theme)
```

The browser instantly resolves all `var(--...)` references to the new values. The `transition: background-color 0.3s ease` on `body` provides a smooth animated switch.

**Alternative considered:** CSS-in-JS (styled-components, emotion).
CSS-in-JS adds JavaScript bundle size and runtime overhead. For a static color theme, native CSS variables are strictly better.

### Single CSS File

All styles are in `index.css`. At this scale (~500 lines) a single file with clear section comments is easier to navigate than CSS Modules or per-component files. If this app grew, the natural next step would be CSS Modules (Vite supports them out of the box with the `.module.css` naming convention).

### Responsive Breakpoints

```css
@media (max-width: 1024px) { /* hide details column in log table */ }
@media (max-width: 768px)  { /* stack viewer and log vertically */ }
```

On mobile, the `main-content` flex row becomes a flex column, so the viewer takes the top half and the action log takes the bottom 40vh.

---

## 8. Build & Deployment Pipeline

### Local Development

```bash
cd plan-viewer
npm install
npm run dev       # Vite dev server with HMR at localhost:5173
```

Vite serves the app using native ES modules — no bundling step during development. Changes appear in the browser in under 50ms.

### Production Build

```bash
npm run build     # TypeScript compile (tsc -b) then Vite bundle
```

This produces an optimised static output in `plan-viewer/dist/`:
- HTML, CSS, and JavaScript are minified
- JavaScript is tree-shaken (dead code removed)
- Assets are content-hashed for cache busting

### GitHub Pages Deployment

The app is deployed automatically via GitHub Actions (`.github/workflows/deploy.yml`):

1. **Trigger:** any push to the `main` branch
2. **Steps:**
   - Check out source code
   - Set up Node.js 20
   - `npm ci` (clean install using the lockfile — reproducible builds)
   - `npm run build`
   - Upload `dist/` as a GitHub Pages artifact
   - Deploy using `actions/deploy-pages@v4`

### Why `base: '/2D-plan-viewer/'` in Vite Config

GitHub Pages serves repositories at `https://username.github.io/repo-name/`, not at the root `/`.
Without setting `base`, Vite generates asset paths like `/assets/main.js`, which 404s on GitHub Pages.
With `base: '/2D-plan-viewer/'`, paths become `/2D-plan-viewer/assets/main.js`.

The same base path is used when referencing the plan image:
```typescript
const BASE_URL = import.meta.env.BASE_URL   // '/2D-plan-viewer/' in prod, '/' in dev
src={`${BASE_URL}foundation-plan.png`}
```

---

## 9. TypeScript Design

### The `LogEntry` Interface

```typescript
// src/types.ts
export interface LogEntry {
  id: number;
  timestamp: string;
  action: 'Zoom In' | 'Zoom Out' | 'Pan' | 'Reset';
  details: string;
}
```

`action` uses a **union type** (string literal union) instead of a plain `string`.
This means:
- `addLog('Scroll', ...)` is a compile-time error — typos are caught before running
- The `switch` statement in `ActionLog` gets exhaustiveness checking
- Function signatures are self-documenting

### `useCallback` and Type Inference

```typescript
const addLog = useCallback((action: LogEntry['action'], details: string) => {
  // ...
}, [nextId])
```

`LogEntry['action']` is an **indexed access type** — it extracts the `action` property type from the interface.
This means the type definition lives in one place (`types.ts`). If you add a new action to the interface, TypeScript immediately shows you everywhere the switch statement needs updating.

### Strict Mode

`tsconfig.json` enables `"strict": true`, which activates:
- `strictNullChecks` — you cannot use a value that might be `null` or `undefined` without checking first
- `noImplicitAny` — every variable must have an inferable or declared type
- `strictFunctionTypes` — function parameter types are checked contravariantly

This forces more careful code up front but prevents an entire class of runtime errors.

---

## 10. Performance Decisions

| Decision | Impact |
|---|---|
| CSS transform (GPU-accelerated) instead of JS animation loop | Smooth 60fps pan and zoom with zero CPU cost during animation |
| `passive: false` only on the viewer element, not the whole window | The browser can still fast-scroll other parts of the page |
| `useCallback` on all event handlers | Prevents child components from re-rendering when the parent re-renders for unrelated reasons |
| `useRef` for `scale` and `position` in event listeners | Eliminates the need to re-attach event listeners on every render |
| `image loaded` opacity transition | Prevents a flash of unsized content before the image dimensions are known |
| Log entries prepended (`[newEntry, ...prev]`) instead of appended | Most recent action is always visible at the top without scrolling |

---

## 11. Potential Interview Questions & Answers

### "Why did you choose React over Vue or plain JavaScript?"
React was the right choice for this project because the UI is composed of clearly separate concerns (viewer, log, header) that map naturally to components, and React's unidirectional data flow makes the interaction between the viewer writing logs and the log displaying them easy to reason about. I'm also most productive in React and it's the most widely used framework in industry.

### "How does the zoom maths work?"
When the user scrolls, I calculate a new scale value clamped between `MIN_ZOOM` (0.25) and `MAX_ZOOM` (5). I then calculate how much the scale changed as a ratio (`scaleChange = newScale / oldScale`). To keep the cursor point stationary, I adjust the image's translation: the new X position is `cursorX - (cursorX - oldX) * scaleChange`. The intuition is: the distance from the cursor to the image's left edge grows by `scaleChange`, so we shift the image left by the same amount to compensate.

### "Why do you use refs alongside state for scale and position?"
The wheel event listener is added with `addEventListener` and wrapped in `useCallback` so it's only created once. A function created once closes over the initial values of state variables and can't see updates (stale closure). I use `useRef` to hold a mutable container that the event handler reads, and a `useEffect` to keep the ref in sync with the state. The state drives the render; the refs drive the event handlers.

### "How does the theme system work?"
I store the user's preference in `localStorage` and read it on first load. The theme value is held in React state, and every time it changes, I call `document.documentElement.setAttribute('data-theme', theme)`. All colours are defined as CSS custom properties — one set under `:root` for light mode and one set under `[data-theme="dark"]` for dark mode. The browser re-evaluates all `var(--...)` references automatically. The `transition` on `body` makes the colour change animate smoothly.

### "Why use GitHub Actions for deployment? Couldn't you just run gh-pages manually?"
Manual deploys require a developer to remember to run the command after every change. Automating it with GitHub Actions ensures the deployed version always matches the `main` branch. It also means any contributor can merge a PR and the deployment happens automatically without needing their local environment set up.

### "What would you add if you had more time?"
Honest priorities:
1. **Tests** — unit tests for the zoom/pan maths using Vitest, and component tests using React Testing Library
2. **Touch support** — pinch-to-zoom and touch panning so mobile users get a native-feeling experience
3. **Minimap** — a small thumbnail in the corner showing the full plan with a viewport indicator
4. **Keyboard shortcuts** — `+`/`-` to zoom, arrow keys to pan, `R` to reset
5. **Multiple plans** — a sidebar to switch between different plan files
6. **Annotations** — ability to click and add a marker/note to a location on the plan

### "This is a frontend-only app. Where would a backend fit in?"
If this were a production product for Spacial.io, a backend would enable:
- **Storing annotations** — users could leave notes on the plan that persist across sessions
- **Authentication** — controlling which users can view which plans
- **Plan management API** — uploading, versioning, and sharing plan files instead of bundling them as static assets
- **Audit trail** — persisting the action log to a database so activity is recorded server-side
- **WebSockets** — real-time collaboration where multiple users see each other's viewport in real time

A natural stack would be Node.js/Express (or a serverless function) with a PostgreSQL database, served behind a REST or GraphQL API.

### "How does `npm ci` differ from `npm install` in the CI pipeline?"
`npm ci` installs exactly the versions recorded in `package-lock.json` and deletes `node_modules` first. It fails if the lockfile is out of sync with `package.json`. This guarantees reproducible builds in CI — every run installs the exact same dependency tree regardless of what was published to npm since the lockfile was last committed.

### "What is `transform-origin: 0 0` and why does the viewer use it?"
CSS transforms are applied relative to an anchor point. The default `transform-origin` is `50% 50%` (centre of the element). If you `scale(2)` with a centred origin, both edges of the image move outward. With `transform-origin: 0 0`, only the right and bottom edges move outward; the top-left corner stays pinned. This makes the position maths simple: `position.x` and `position.y` are always the pixel coordinates of the image's top-left corner in the container, regardless of scale.
