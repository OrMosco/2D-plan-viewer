# 2D Plan Viewer — Interview Questions & Answers

This document provides thoughtful, detailed answers to common interview questions about this project.

---

## 1. If you had more time, what would you have improved on this project?

### Testing Infrastructure (Top Priority)
I would add **comprehensive testing** using Vitest and React Testing Library:
- **Unit tests** for the zoom math functions — the cursor-centered zoom calculation (`newX = cursorX - (cursorX - oldX) * scaleChange`) is the most logic-heavy part of the app and deserves tests to ensure edge cases are handled correctly (e.g., zoom at MIN_ZOOM boundary, zoom at MAX_ZOOM boundary, zoom at exact corners of the image).
- **Component tests** for `PlanViewer` — verify that wheel events trigger zoom, mouse events trigger pan, and double-click resets the view.
- **Integration tests** for the logging system — ensure that every user interaction properly calls `addLog()` and appears in the `ActionLog` component.

### Touch & Gesture Support
Currently, the app only supports mouse-based interactions. I would add:
- **Pinch-to-zoom** using the Touch Events API or Pointer Events API
- **Two-finger pan** for mobile devices
- **Inertial scrolling** — when the user releases after a fast pan, the view continues moving and decelerates naturally

### Accessibility Improvements
- **Keyboard navigation** — `+`/`-` keys to zoom, arrow keys to pan, `R` or `Home` to reset
- **ARIA labels** for screen readers on the zoom/position badges and action log
- **Focus management** — ensure tab order makes sense and the viewer can be "entered" with the keyboard
- **Reduced motion** — respect the `prefers-reduced-motion` media query and disable animations for users who have that preference set

### Performance Optimizations
- **Throttle zoom events** — wheel events can fire 60+ times per second; I would throttle the log updates to every 100ms while still updating the view in real-time
- **Virtualized log list** — if the action log grows large (100+ entries), use a virtualized list (e.g., `react-virtual`) to only render visible rows
- **Image lazy loading and placeholder** — for very large plan images, show a low-res blur-up placeholder while the full image loads

### Additional Features
- **Minimap** — a small overview in the corner showing the full plan with a draggable viewport rectangle
- **Multiple plan files** — a sidebar or dropdown to switch between different plans
- **Annotations** — click to add markers or notes at specific locations on the plan
- **Measurement tool** — click two points to measure distance (would require scale metadata)
- **Export/share** — generate a link that encodes the current zoom level and position

---

## 2. What did you struggle with most when building this project?

### The Cursor-Centered Zoom Math
The most challenging part was getting the **zoom behavior to feel natural**. The requirement was: when you scroll to zoom, the point under your cursor should stay stationary — the image should expand or contract around that point.

The naive approach of just changing the `scale` value causes the image to zoom toward the top-left corner (because `transform-origin: 0 0`). To fix this, I had to:

1. Calculate the cursor position relative to the container
2. Determine where the cursor sits relative to the image's current position
3. After scaling, adjust the image position so the same image pixel stays under the cursor

The formula:
```typescript
const scaleChange = newScale / currentScale
const newX = cursorX - (cursorX - currentPos.x) * scaleChange
```

I had to draw diagrams and step through the math manually to convince myself this was correct. Then I tested edge cases: zooming at the exact center, zooming at the corners, zooming at min/max boundaries.

### The Stale Closure Problem
I also struggled with React's **stale closure** issue. The wheel event listener is attached imperatively with `addEventListener` because I need `{ passive: false }` to call `preventDefault()`. 

If I created the handler function on every render, I'd need to remove and re-add the listener on every render, which is wasteful. So I wrap the handler in `useCallback` with an empty dependency array — but then the handler only ever sees the initial values of `scale` and `position`.

The solution was to use `useRef` to hold mutable containers that the handler reads, and `useEffect` to keep the refs in sync with state:
```typescript
const scaleRef = useRef(1)
useEffect(() => { scaleRef.current = scale }, [scale])
```

This pattern is common but non-obvious; it took me time to understand why the handler was seeing "stale" values and how to fix it.

### Global Mouse-Up Handling
Another tricky edge case was handling **mouse-up events that occur outside the viewport**. If a user starts panning inside the viewer but releases the mouse button outside the browser window, the container's `mouseup` event never fires. The app would get stuck in "panning mode" forever.

The fix was to attach a `mouseup` listener to `window` that also ends panning, ensuring the event is caught regardless of where the mouse is released.

---

## 3. What are you most proud of about this project?

### The Polished User Experience
I'm most proud of how **smooth and responsive** the viewer feels. The cursor-centered zoom is natural — it behaves exactly like Google Maps or Figma. The CSS `transform` approach means the browser's GPU handles all rendering; there's no JavaScript running during the animation. Even on a low-end device, zooming and panning are butter-smooth at 60fps.

### The Clean Component Architecture
I'm proud of the **clear separation of concerns**:
- `App` owns all shared state and passes callbacks down
- `PlanViewer` handles its own local state (scale, position) because no other component cares about those values
- `ActionLog` is a pure presentational component — it receives data and displays it, nothing more
- `Header` and `Footer` are stateless and reusable

This structure makes the codebase easy to navigate. A new developer can look at any component and immediately understand its responsibility.

### The Theme System
The light/dark mode switch is implemented with **zero runtime JavaScript cost** after the initial render. All colors are CSS custom properties; switching themes is a single `setAttribute` call. The browser handles re-evaluating all `var(--...)` references instantly, and the CSS `transition` makes the switch feel polished.

### The Real-Time Action Log
The action log with **millisecond-precision timestamps** is a nice touch. When you scroll rapidly, you can see exactly how many zoom events fired and when. The color-coded badges (blue for zoom in, yellow for zoom out, green for pan, purple for reset) make it easy to scan at a glance.

### The Documentation
I'm proud that I took the time to write the `ARCHITECTURE.md` document. It explains every decision — why React over Vue, why CSS variables over CSS-in-JS, why refs alongside state, why `passive: false` on the wheel listener. Future me (or any other developer) can read it and understand not just _what_ the code does but _why_ it was written that way.

---

## 4. Why did you choose this specific implementation?

### React + TypeScript + Vite
- **React** because it's the industry standard for component-based UIs, I'm most productive in it, and the unidirectional data flow makes state management predictable. The app has clear "data flows from App → children, events flow up via callbacks" semantics.
- **TypeScript** because it catches bugs at compile time (e.g., typos in action names like `'Scrool'` instead of `'Scroll'`), makes refactoring safe, and documents intent in function signatures.
- **Vite** because it has sub-50ms hot module replacement during development, native ES modules in dev mode, and produces optimized production bundles out of the box.

### CSS Transforms Instead of Canvas
I chose **CSS transforms** over `<canvas>` for the viewer because:
- CSS transforms are GPU-accelerated by the browser's compositor — no JavaScript runs during the animation
- The browser handles high-DPI scaling automatically
- I can style the image with CSS (e.g., the opacity fade-in on load)
- Canvas would require manual redrawing on every frame and pixel manipulation

The transform approach delivers 60fps pan/zoom with almost no code.

### No Global State Library (Redux, Zustand)
I intentionally **did not use Redux or Zustand** because:
- The app has only 3 pieces of shared state: `theme`, `logs`, and `nextId`
- These are used by at most 2 components that are 1 level apart in the tree
- Passing props 1 level is not "prop drilling" — it's the idiomatic React pattern
- Adding a state library would mean actions, reducers, selectors, and a provider for minimal benefit

If the app grew to have 10+ shared state values or deeply nested components, I'd reconsider.

### No UI Component Library (MUI, Ant Design)
I **hand-wrote all CSS** because:
- The design is simple enough that custom CSS is faster to iterate on
- The bundle stays small (no 100KB+ library overhead)
- I have full control over theming and styling
- The project demonstrates my CSS skills rather than my ability to configure a library

### Local State for Viewer vs Lifted State for Logs
I kept `scale` and `position` **local to PlanViewer** because only that component reads and writes those values. There's no reason to lift them.

I lifted `logs` to `App` because:
- `PlanViewer` writes to it (via `addLog`)
- `ActionLog` reads from it
- `App` is their common parent

This follows the React principle: "lift state to the lowest common ancestor of the components that need it."

### `passive: false` for Wheel Events
I explicitly set `{ passive: false }` on the wheel listener because:
- Chrome 73+ defaults scroll listeners to `passive: true` for performance
- `passive: true` means you cannot call `preventDefault()`
- Without `preventDefault()`, the page would scroll _and_ the image would zoom simultaneously

This trade-off is appropriate because:
- It only affects the viewer element, not the whole page
- The interaction is intentional (the user is zooming, not scrolling)

### GitHub Actions for CI/CD
I automated deployment with **GitHub Actions** because:
- Every push to `main` triggers a build and deploy
- No developer needs to remember to run `npm run deploy` manually
- Contributors can merge PRs and see changes go live without local environment setup
- The deployed version always matches the `main` branch

---

## Summary

| Question | Key Takeaway |
|----------|--------------|
| **What would you improve?** | Testing, touch support, accessibility, performance optimizations |
| **What did you struggle with?** | Cursor-centered zoom math, stale closures in event handlers, global mouse-up edge case |
| **What are you most proud of?** | The smooth UX, clean architecture, elegant theme system, and thorough documentation |
| **Why this implementation?** | React for productivity, TypeScript for safety, CSS transforms for performance, minimal dependencies for simplicity |
