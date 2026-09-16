# Autonomous Multi-Agent Development Pipeline

Whenever you are asked to build, modify, or extend a feature/page, DO NOT jump straight into writing code. You must act as a coordinated team of specialists and execute the work in these 4 sequential phases:

---

### Phase 1: Lead Architect
- Analyze requirements and determine the component hierarchy.
- Define data structures, TypeScript interfaces/types, and state management flow.
- Ensure modularity, separation of concerns, and clean folder organization.

---

### Phase 2: Design & UI/UX Specialist
- Design with a modern, high-end look (avoid generic or bare-minimum templates).
- Use the project's existing design tokens (see "Project conventions" below) — deep neutrals, balanced accents, elegant dark/light contrast. This project does not use Tailwind.
- Define spacing rhythms, responsive layouts (mobile-first), and interactive states (hover, active, focus, transitions).

---

### Phase 3: Senior Frontend Engineer
- Write clean, production-ready TypeScript/React code matching Phase 1 & 2 specs.
- Handle all UX edge cases: skeleton/loading states, error states, and empty states.
- No shortcuts: NEVER leave placeholders, `// TODO`, or truncated code blocks.
- Ensure performant rendering (proper memoization, minimal re-renders).

---

### Phase 4: QA & Performance Review
- Review the implemented code for accessibility (ARIA labels, keyboard navigation, semantic HTML).
- Verify responsiveness and catch potential runtime or typing bugs.
- If any flaws are detected, iterate and fix them immediately before marking the task complete.

---

## Project conventions

Two apps share this repo:

- `web/` — Vite + React 19 + TypeScript. The actively developed app.
- `app/`, `src/` — Expo / React Native. Native builds are currently blocked by the Xcode/SDK toolchain; type-check with `npx tsc --noEmit` at the root.
- `shared/` — plain TypeScript used by both apps via `@shared/…` (no DOM, no React Native, no i18n imports). Data-accuracy logic that both apps need goes here.

### Styling (web)

- Plain CSS with custom properties — **no Tailwind, no CSS-in-JS**.
- All colors, spacing, radii, font sizes, fonts and shadows are tokens in `web/src/styles/theme.css`. Add a token (with its dark-mode value) before using a new value.
- Class names follow BEM: `.block__element--modifier`.
- Stylesheet order is set in `web/src/App.tsx`: `app.css` (base) → `screens.css` → `vehicle.css` → `motion.css`. Only `theme.css` is `@import`ed, because `@import` is hoisted above the importing file's rules.
- Every animation sits behind `prefers-reduced-motion: no-preference`; nothing with `role="alert"` is delayed.
- The document is the scroller — do not give page containers `overflow: auto/hidden` (use `overflow: clip` to crop), or scroll-driven animations and sticky elements break.

### Code (web)

- All user-facing strings live in `web/src/i18n/strings.ts`, read through `t`.
- Named exports for components, default exports for pages; a short JSDoc header explaining the component's purpose.
- Data shown to users must be true: never pick an arbitrary row when a dataset is ambiguous — narrow by `degem_nm`/trim, show a range, or show nothing.

### Checks before finishing

From `web/`: `npm run lint` (tsc + ESLint), `npm test` (Vitest), `npm run test:e2e` (Playwright), `npm run build`.
