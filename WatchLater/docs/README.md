# 📱 WatchLater Web App

WatchLater transforms long-form YouTube videos into structured, Markdown summaries powered by Gemini 2.5 Flash. The July 2025 refresh introduces an iOS 26–inspired interface that feels at home on iPhone, iPad, and desktop while honouring the latest Human Interface Guidelines.

## 🧱 Architecture Snapshot

```
repo-root/
├── docs/                         # Product and design references
├── prompts/                      # Prompt templates for Gemini
├── public/
├── src/
│   ├── App.tsx                   # App shell + workflow orchestration
│   ├── api.ts                    # Client to the local Express bridge
│   ├── components/               # Reusable UI building blocks
│   │   ├── AppHeader.tsx         # Sticky header with large-title collapse
│   │   ├── GlassCard.tsx         # Frosted container primitive
│   │   ├── Icon.tsx              # Lucide-based symbol normaliser
│   │   ├── PipelineStepper.tsx   # 4-stage processing indicator
│   │   ├── PrimaryCTA.tsx        # 44×44+ rounded action button
│   │   ├── SegmentedControl.tsx  # Tabbed navigation widget
│   │   ├── SummaryListItem.tsx   # Saved summary row with quick actions
│   │   └── Toast.tsx             # Transient status messaging
│   ├── lib/                      # Lightweight utilities
│   │   └── scroll-header.ts      # Scroll listener for translucent header
│   └── styles/                   # Design token + base layers
│       ├── app.css               # Page-level layout + motion rules
│       ├── base.css              # Resets, focus, and control standards
│       └── tokens.css            # Light/dark/high-contrast design tokens
├── server.js                     # Express API for transcripts + storage
└── tests/                        # Jest + Testing Library coverage
```

## ✨ Experience Pillars

1. **Glass & Depth** — Translucent surfaces respect `prefers-reduced-transparency`, fall back to opaque surfaces in high-contrast, and limit blur radius for performance.
2. **Responsive Typography** — System fonts with size guards (≥ 11 pt equivalent) and large-title collapse behaviour that mirrors native iOS navigation bars.
3. **Accessible Controls** — 44×44 px minimum targets, keyboard focus rings, aria landmarks, and keyboardable segmented tabs.
4. **Motion with Restraint** — Micro interactions for success pulses and pipeline progress while honouring `prefers-reduced-motion`.
5. **Trustworthy Feedback** — Inline toasts, aria-live regions, and transcript visibility toggles keep sighted and screen-reader users in sync.

## 🎨 Design System Highlights

- **Design Tokens** (`src/styles/tokens.css`)
  - Neutral palette tuned for dark-first with light overrides via `data-theme="light"` and `prefers-color-scheme`.
  - Semantic roles (`--bg`, `--surface`, `--tint`, `--success`, `--danger`) and control layers (`--field-bg`, `--field-border`).
  - Accessibility hooks for `prefers-contrast: more` and `prefers-reduced-transparency` remove blur and increase divider contrast.

- **Base Layer** (`src/styles/base.css`)
  - System font stack, gradient background, focus outlines, and 44×44 button guarantees.
  - Motion clamp for `prefers-reduced-motion` and shared animation primitives (`.fade-in-up`, `.success-anim`).

- **Component Styling** (`src/styles/app.css` & `src/components/Glass.css`)
  - Sticky translucent header with large-title collapse at 8 px scroll.
  - Hero, cards, segmented control, pipeline stepper, and summary detail layouts.
  - Alert, toast, and summary list treatments with WCAG AA contrast in light/dark modes.

## 🧩 Component Inventory

| Component | Role | Accessibility Notes |
|-----------|------|----------------------|
| `AppHeader` | Sticky shell, theme toggle, summary count badge | Uses `aria-live` for counts, collapses large title on scroll |
| `PrimaryCTA` | Pill-shaped main action | `data-loading`, sticky mobile affordance, 44×44 target |
| `GlassCard` | Frosted container primitive | Accepts semantic element via `as` prop |
| `PipelineStepper` | Metadata → Transcript → AI Processing → Save | Announces active step with `aria-current="step"` and error state highlighting |
| `SegmentedControl` | Tabbed/segmented navigation | Keyboard arrows/Home/End, `role="tablist"`, badges for counts |
| `SummaryListItem` | History row with quick actions | Buttons labelled for screen readers, highlights active summary |
| `Toast` | Inline status feedback | Chooses `role="status"` or `role="alert"` based on message type |

## ♿ Accessibility & Motion

- Landmarks: `<header>`, `<main>`, `<section>`, `<aside>` anchor major regions.
- `aria-live="polite"` notifies pipeline updates and toast states; transcript toggle exposes `aria-expanded` + `aria-controls`.
- Theme toggle honours stored preference + system fallback (`data-theme` attribute) and exposes controls in Settings tab.
- Pipeline card uses colour and icon pairs (check/alert) with text labels to ensure state comprehension.
- Micro-interactions (success pulse, fade-in) disable automatically when `prefers-reduced-motion` is active.

## ✅ QA Checklist Alignment

- 44×44 px hit targets validated across CTA, icon buttons, segmented control.
- Dark/light/high-contrast theme support verified via CSS variables and `prefers-contrast` overrides.
- Header blur deactivates for `prefers-reduced-transparency` and when blur not supported.
- Sticky CTA engages on viewports ≤ 768px using `matchMedia` detection.
- Pipeline stepper announces progress with keyboard + screen reader support.

## 🔬 Testing

- `npm run test` executes Jest + Testing Library suites, covering segmented control keyboard behaviour and pipeline accessibility.
- Manual QA: follow the checklist in `docs/README.md` alongside voice-over quick pass and Lighthouse snapshot before release.

For extended feature planning, see the task list in `tasks/tasks-prd-youtube-summarizer.md`.
