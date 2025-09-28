# Phase 3 — Tactiq-Inspired UI Redesign

This note captures the discovery insights and implementation direction for the Phase 3 visual refresh. It mirrors the structure of the project task list so the team can trace each checkbox back to supporting evidence.

## 10.0 Discovery & Experience Brief

### 10.1 Tactiq Landing Page Breakdown
- **Layout**: Centered hero with stacked headline, subheadline, and proof points; asymmetric cards below fold.
- **Copy Hierarchy**: Title (≈42px) → Supporting sentence (≈20px) → Microcopy lines (≈14px) with light weight.
- **Color Language**: Deep violet (#0D021F) base with radial neon gradients (#9146FF → #5CF2B5). Buttons use solid gradients; text links lean cyan.
- **Interaction States**: Hover lifts cards with subtle shadow bloom; buttons brighten gradient and add 1px outline; inputs glow with inner shadow.
- **Motion**: Progress indicators slide/fade, hero glyph pulses at 600ms cadence, micro interactions ease-out at 160ms.

### 10.2 WatchLater Inventory
- Catalogued screens: landing hero, processing state, success summary, history drawer.
- Preserved functional requirements: instant paste detection, four-stage progress indicator, transcript accordion, summary history.
- Identified debt: Tailwind-like classes without utility engine, lack of design tokens, inconsistent spacing scale.

### 10.3 UI Brief & Brand Guide
- **Typography**: Adopt `Space Grotesk` for headings, `Inter` for body; define scale (42/32/24/18/16/14).
- **Color Tokens**: `--surface-base: #0B0614`, `--surface-contrast: rgba(255,255,255,0.02)`, gradients `--gradient-primary: linear-gradient(135deg, #7F5BFF 0%, #42E3AE 100%)`.
- **Assets**: Require SVG logomark, animated dot glyph, screenshot placeholders.
- **Approval**: Circulate this brief plus mockups for sign-off prior to build (Figma link placeholder: `TODO : add figma share url`).

## 11.0 Visual System & Design Tokens

### 11.1 Global Style Primitives
- Define CSS custom properties in `src/index.css` for fonts, spacing scale (`4, 8, 12, 16, 24, 32`), radii (`8px`, `16px`, pill `999px`), and shadows (`0 20px 40px -20px rgba(124, 108, 255, 0.35)`).
- Map these tokens to utility classes or inline styles for the interim while Tailwind adoption is evaluated.

### 11.2 Background & Container System
- Implement root gradient macro: `background: radial-gradient(120% 120% at 20% 20%, rgba(127,91,255,0.45), transparent), radial-gradient(140% 140% at 80% 0%, rgba(66,227,174,0.35), transparent), #08040F`.
- Create `.glass-card` class: `background: rgba(15, 10, 26, 0.75); border: 1px solid rgba(166, 142, 255, 0.2); backdrop-filter: blur(18px); padding tokens applied.`

### 11.3 CTA & Typography Treatments
- Primary button: pill radius, gradient background, white text, drop shadow; hover intensifies gradient and adds outer glow.
- Secondary button: transparent fill, gradient stroke, text in gradient via `background-clip: text`.
- Headline gradient text using `-webkit-text-fill-color: transparent; background-clip: text;`. Body copy stays high-contrast neutral (#E6E1F5).

## UI Mockups (Textual)

### Hero & URL Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGO ◎ WatchLater                                                         │
│                                                                             │
│  Learn faster with instant YouTube summaries                                │
│  Paste any link and receive actionable insights in seconds.                 │
│                                                                             │
│  [ 🔍  https://youtube.com/…                           ] [ Summarize ▷ ]     │
│  ✓ No uploads • ✓ Local processing • ✓ Keeps your workflow private           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Progress & Summary Surface
```
┌───────────── glass-card ─────────────┐  ┌──────────── summary card ───────────┐
│ Metadata   ● Transcript   ● AI ● Save │  │ Key Takeaways                       │
│ ● Video title + channel avatar        │  │ • …                                  │
│ ● Pulsing glyph and status text       │  │ • …                                  │
│                                         │  │                                    │
│ ⌛ Stage 2  Fetching transcript…       │  │ Full summary content (markdown)     │
└───────────────────────────────────────┘  └─────────────────────────────────────┘
```

### History Drawer
```
┌─ HISTORY ─────────────────────────────┐
│  Today                                  │
│  • Never Gonna Give You Up             │
│  • Ali Abdaal – Creators in 2025       │
│  Earlier                                │
│  • Lex Fridman on AI alignment         │
└────────────────────────────────────────┘
```

*Mockups depict layout, spacing, and component hierarchy; gradients/typography follow the tokens above.*

## Next Steps
- Share this document with stakeholders for visual alignment.
- Translate tokens into actual CSS/Tailwind utilities in implementation phase (Phase 3 build tasks 12+).
- Update README and marketing collateral once redesign ships.
