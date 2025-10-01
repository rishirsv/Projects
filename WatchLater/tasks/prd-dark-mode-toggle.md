# Dark Mode Toggle PRD

## Introduction / Overview
WatchLater currently renders only a light interface. Users working in dim environments, at night, or who simply prefer darker interfaces experience glare and fatigue, and the product feels dated relative to comparable productivity tools. This project introduces an explicit light/dark toggle in the header (to the left of the refresh icon) and a full dark theme that mirrors existing brand colors while preserving accessibility and layout stability.

## Goals
- Provide an always-visible toggle that instantly switches between light and dark themes without reloading the page.
- Define a dark palette that adapts existing purples, blues, gradients, and accents for dark surfaces while maintaining WCAG AA contrast.
- Respect user preference by persisting the explicit selection (light, dark, or system) and honoring `prefers-color-scheme` when no choice is stored.
- Ensure every major surface (header, hero, pipeline stages, cards, history, modals, toasts, markdown viewer, scrollbar/background) receives theme-aware styling.
- Maintain parity across documentation, screenshots, and marketing assets highlighting the new theme capability.

## Non-Goals
- No net-new theming frameworks or design overhauls; reuse the existing CSS architecture with variables.
- No schedule-based auto switching (sunset/sunrise) beyond the system preference fallback.
- No typography, spacing, or component restructuring changes unless required for contrast.
- No backend changes outside of optional documentation updates.

## User Stories
- As a night-owl researcher, I want to flip the WatchLater interface to dark mode so I can work comfortably without eye strain.
- As a product demo lead, I want both light and dark themes to look on-brand so screenshots and videos align with marketing materials.
- As an accessibility reviewer, I want theme changes to keep focus outlines and text legible so compliance is maintained across modes.

## Success Metrics
- Qualitative: ≥90% of user interviews or support tickets report improved readability in dark environments within the first month.
- Quantitative: <5% increase in CSS bundle size compared to baseline after gzip; no new accessibility bugs recorded.
- Operational: Zero regression bugs filed against the theme toggle during the first release cycle.

## Dependencies & Assumptions
- Existing React/Vite setup with CSS modules/global styles is retained; no third-party theming library is introduced.
- LocalStorage is available for persistence (guarded for SSR/Node contexts during tests).
- Icons (sun/moon) can be sourced from existing asset sets or simple inline SVGs.
- QA access to devices/browsers that support `prefers-color-scheme` is available to verify auto-detection.

## Functional Requirements
1. Render a toggle control in the header immediately to the left of the refresh icon with an accessible name describing the next mode (e.g., "Switch to dark mode").
2. Support three logical states: `light`, `dark`, and `system` (auto). The UI must expose light and dark explicitly; system may be offered via contextual dropdown or an inline third state.
3. Persist the explicit user choice under a dedicated localStorage key (`watchlater-theme-preference`). Clearing that key re-enables system detection.
4. On first load (no stored preference), default to the OS/browser `prefers-color-scheme` and apply the corresponding theme before the first paint to avoid FOUC.
5. Apply theme-specific color tokens across all core UI surfaces, including header, hero, buttons, input fields, pipeline, history list, modals, markdown areas, scrollbars, and toasts.
6. Ensure all text/background combinations meet WCAG AA contrast thresholds (4.5:1 for body text, 3:1 for large text and icons) in both modes.
7. Theme changes must occur instantly via React state/context without page reloads or layout shifts; transitions should be optional and subtle.
8. Update docs/README with setup guidance and add dark theme screenshots to the marketing folder or PR assets.

## User Experience & Accessibility
- **Placement**: Toggle sits in the header toolbar, to the immediate left of the refresh icon, using the same vertical alignment and spacing as neighboring controls.
- **Affordance**: Display current mode using sun (light) and moon (dark) glyphs. Optional segmented control UI if a third "System" option is surfaced inline.
- **Tooltip / Labeling**: Provide `title` text and `aria-label` that describes the action ("Switch to dark mode" / "Switch to light mode").
- **Feedback**: Theme swap applies across the entire UI with no flicker; toasts inherit the current palette so success/error states remain legible.
- **Keyboard & Screen Readers**: Toggle must be reachable via tab order, support `Enter`/`Space`, and announce state changes via `aria-pressed` or similar attributes.
- **Contrast & Focus**: Validate focus outlines, buttons, and link states maintain visibility; adjust token values to preserve AA compliance.

## Technical Approach
- Normalize color usage by introducing semantic CSS variables (e.g., `--color-bg`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-accent`, success/danger tokens) defined in the light theme under `:root`.
- Add `[data-theme="dark"]` overrides (or `:root[data-theme="dark"]`) that swap values for backgrounds, surfaces, text, and accent tokens.
- Create a dedicated theme hook or context (`useTheme` in `src/hooks/` or `src/context/`) responsible for:
  - Reading stored preference and system setting (`window.matchMedia('prefers-color-scheme: dark')`).
  - Providing `theme`, `resolvedTheme` (after system resolution), `setTheme`, and hydration guards for SSR/test environments.
  - Updating `document.documentElement.dataset.theme` and optional `<meta name="color-scheme">` values.
- Refactor key components/styles to reference CSS variables instead of literal color codes (audit via `rg` for hex values).
- Provide SSR/test guards to avoid accessing `window` during Jest runs.

## Implementation Plan (Step-by-Step)
1. **Audit & Tokenization**
   - Inventory existing color values (CSS, inline styles) and map them to semantic tokens.
   - Define default light theme tokens under `:root` and ensure global styles consume variables.
2. **Theme State Infrastructure**
   - Implement `useTheme` hook/context with localStorage persistence, system preference detection, and SSR-safe guards.
   - Apply theme attribute to `<html>` on initialization (and update `<meta name="color-scheme">`).
3. **Dark Theme Palette**
   - Create dark overrides for tokens leveraging brand purples/blues for surfaces, background gradients, and text colors.
   - Validate hero gradients, charts, and interactive states for contrast.
4. **Component Styling Updates**
   - Update header, hero, pipeline, forms, buttons, history list, modals, markdown viewer, scrollbars, and toasts to rely on tokens.
   - Ensure icon fills/strokes adapt per theme.
5. **Toggle UI**
   - Build a `ThemeToggle` component (icon button or segmented control) with keyboard/ARIA support.
   - Place in header to the left of refresh, adjusting layout spacing as needed.
   - Wire toggle to `useTheme` and update tooltips/labels dynamically.
6. **Persistence & System Mode**
   - Persist explicit selections; expose optional "System" state if product wants parity with OS default.
   - Listen for `prefers-color-scheme` changes when in system mode to update automatically.
7. **Docs & Assets**
   - Update README/docs with configuration details and add light/dark screenshots.
8. **Validation**
   - Run automated suites (`npm run lint`, `npm test -- --runInBand`, `npm run build`).
   - Execute manual QA checklist covering contrast, toggling, persistence, and responsive layouts.

## Validation & Test Plan
- **Automated**: Existing lint/tests/build must pass. Add unit tests for the theme hook (preference resolution, system fallback) if feasible.
- **Manual QA Checklist**:
  - Verify initial load respects OS preference with no flash of incorrect theme.
  - Toggle between modes; refresh to confirm persistence.
  - Inspect hero, pipeline, history list, modals, markdown, toasts, and scrollbars in both themes for contrast and readability.
  - Confirm keyboard/ARIA behavior for the toggle using screen reader smoke tests.
  - Validate icon visibility and focus outlines in both themes.
  - Test across desktop and mobile breakpoints for layout fidelity.

## Analytics & Logging
- Optional: emit a non-PII log event when users change theme (behind a feature flag) to gauge adoption.
- Track preference counts locally or via analytics if instrumentation exists; otherwise document manual observation steps.

## Risks & Mitigations
- **Incomplete Token Coverage**: Some components might retain hardcoded colors → mitigate with thorough audit (`rg` for hex codes) and QA sign-off.
- **Contrast Failures**: Dark palette might not meet WCAG → iterate on shades and verify using accessibility tooling (Stark, DevTools).
- **FOUC During Load**: Flash of light theme before dark applies → set initial attribute synchronously and leverage `prefers-color-scheme` media query in inline styles.
- **Persistence Errors**: Accessing localStorage in non-browser contexts could throw → guard with `typeof window !== 'undefined'` checks and try/catch around storage operations.
- **Icon Legibility**: Existing icons may disappear on dark backgrounds → provide theme-aware fills or alternative assets.

## Rollout Strategy
- Develop on feature branch, run full automated suite, collect QA notes/screenshots.
- Include before/after screenshots in PR description.
- Launch as a default-on enhancement once merged; no feature flag required.
- Backout plan: revert the feature branch to restore light-only theme. Retain token groundwork if it does not introduce regressions.

## Timeline Estimate
- Token audit & light theme refactor: ~0.5 day.
- Dark palette definition & component updates: ~1 day.
- Toggle UI integration, persistence, QA, docs: ~0.5 day.
- **Total**: ~2 focused engineering days plus QA sign-off.

## Open Questions
- Should the UI expose an explicit "System" state or silently honor OS preference until the user picks light/dark?
- Do PDF exports (and other generated assets) need dark theme variants, or can they remain light for now?
- Should analytics capture theme adoption, and if so, where should events be logged?
- Are there marketing or help-center assets that need simultaneous updates for launch parity?

## Task Checklist
- [ ] Audit color usage and define semantic CSS variables for the light theme.
- [ ] Build `useTheme` (or context) with localStorage persistence and system detection.
- [ ] Apply light/dark tokens across global and component styles, ensuring contrast compliance.
- [ ] Create and integrate the header `ThemeToggle` component with icons and accessibility wiring.
- [ ] Ensure iconography and illustrations adapt to both themes.
- [ ] Update documentation/screenshots to cover theme options.
- [ ] Complete manual QA checklist and run automated tests (lint, test, build).
