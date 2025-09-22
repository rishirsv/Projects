# PRD — Quality Dials (Prompt Templates & Model/Length Controls) (C)
_Date: 2025-09-22_

## 1) Introduction / Overview
Add **quality dials** to the UI so users control **summary length**, **style**, and **model**. Each selection maps to a **prompt template** (with variables) used during summarization. Defaults should work out of the box; advanced users can tweak.

**Goal:** Make summaries fit the moment (quick skim vs deep dive) and match tone preferences.

## 2) Goals
- G1. Provide UI controls for **Length** (Short/Medium/Long) and **Style** (Bullet vs Narrative).
- G2. Allow **Model** selection (e.g., Flash vs Pro).
- G3. Map each combination to a **prompt template** without code changes (templates are files).
- G4. Persist user preferences (local) and use them in **single** and **batch** runs.

## 3) User Stories
- As a user, I can choose **Short + Bullet** for fast skims.
- As a user, I can switch to **Long + Narrative** for deeper notes.
- As a user, I can pick a **model** balancing speed and quality.
- As a user, my choices **stick** across sessions and apply to batch jobs.

## 4) Functional Requirements
1. Add a **Settings** panel (or header controls) with:
   - Length: **Short**, **Medium**, **Long** (default: Medium)
   - Style: **Bullet**, **Narrative** (default: Bullet)
   - Model: **Flash**, **Pro** (default: Flash)
2. Templates live under `/prompts/templates/` (e.g., `summary-short-bullet.md`, `summary-long-narrative.md`). Variables: `{title}`, `{channel}`, `{transcript}`, `{length}`, `{style}`.
3. The client (or server) loads the selected template, performs variable substitution, and calls the summarizer.
4. The template **ID** and chosen **model** are recorded in metadata and saved with the summary output.
5. Batch runs use the **current saved preferences** by default.
6. If a template is missing, fallback to a safe default and log a warning.

## 5) Non‑Goals
- A full template editor UI (future). For now, templates are versioned files.
- Per‑video custom prompts in a single run.

## 6) Design Considerations
- Compact controls near the URL field; link to Settings for more.
- Show the active profile (e.g., “Medium • Bullet • Flash”).
- Optional “Preview Prompt” modal for power users.

## 7) Technical Considerations
- Add a `PromptTemplate` loader util to read templates from `/prompts/templates/` in dev; for Cloud Run, embed templates at build time or load from GCS.
- Ensure summarization path uses **server‑side** route if Cloud Run mode is enabled; otherwise, client path remains supported.
- Persist preferences in `localStorage` (`summaryPrefs` key) and expose via a React context.

## 8) Success Metrics
- ≥ 80% of runs use non‑default settings after 2 weeks (indicates utility).
- Support ticket count for “prompt too long/short” drops to near zero.
- No increase in error rate; latency impact < 10% for Flash model.

## 9) Open Questions
- Do we need a **Tone** (e.g., “technical”, “plain‑English”) toggle now or later?
- Should we expose a **Max tokens** setting, or keep it hidden behind templates?

---

## **Implementation Task List (Appended)**

### Relevant Files
- `src/views/Settings.tsx` — Add quality dial controls.
- `src/components/QualityDials.tsx` — Inline quick controls (new).
- `src/context/PrefsContext.tsx` — Provide prefs across the app (new).
- `src/lib/promptTemplates.ts` — Loader/substitution utils (new).
- `prompts/templates/summary-*.md` — Template files (new).
- `src/api.ts` — Pass `templateId`, `model`, `length`, `style` to summarizer route.
- `server.js` — If server‑side summarization is enabled, load template and call model.
- `tests/promptTemplates.test.ts` — Unit tests for loader & substitution (new).

### Tasks
- [ ] 1.0 Data model & storage
  - [ ] 1.1 Define `SummaryPrefs` type (length, style, model, templateId)
  - [ ] 1.2 Add `PrefsContext` with `localStorage` persistence
- [ ] 2.0 Templates
  - [ ] 2.1 Create baseline templates: short/med/long × bullet/narrative
  - [ ] 2.2 Build `promptTemplates.ts` (load, cache, substitute)
  - [ ] 2.3 Fallback to default on missing template; log warning
- [ ] 3.0 UI
  - [ ] 3.1 Add `QualityDials` near URL input (Length, Style, Model)
  - [ ] 3.2 Add Settings page section; show active profile
  - [ ] 3.3 Optional: “Preview Prompt” modal
- [ ] 4.0 Pipeline integration
  - [ ] 4.1 Client path: include prefs in summarize call
  - [ ] 4.2 Server path (if enabled): server loads template & calls model
  - [ ] 4.3 Save templateId/model in summary metadata
- [ ] 5.0 Tests
  - [ ] 5.1 Unit: substitution (placeholders, escaping, long transcripts)
  - [ ] 5.2 Integration: ensure selected prefs affect outputs

