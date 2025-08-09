---
purpose: validation rubric
applies_to: "Template_Standard.md, Template_Essential.md, Template_Advanced.md, Template_DeepResearch.md"
description: "Pre-output validation rubric for Meta Prompter. Use after assembling artifacts; revise until pass."
---

## How to use
1. Evaluate the **Upgraded Prompt** (and any optional variants) against **Core Requirements**.  
2. If any fail → revise and re-run this rubric.  
3. If blocked by missing inputs → add a single **“Needs Input”** stub or ask **one** precise clarifying question, then stop.

---

## Core Requirements (Must Pass All)
- [ ] **Template choice fits task intent** 
- [ ] **Agentic settings** listed (Reasoning effort, Verbosity)
- [ ] **Plan Preamble** present if required by template (3–7 concise bullets).  
- [ ] **Output**
- [ ] **Document handling** correct if inputs provided (integrated/synthesized per template rules).  
- [ ] **Assumptions disclosed**; no hidden leaps.  
- [ ] **Single fenced Markdown code block**; no extra text outside block.  
- [ ] **Validation applied** (this rubric) before return.

---

## Quality Metrics (Score /10)
Score each, then sum.

### 1) Clarity — 0–4
- 4: Objective & success criteria unambiguous and fully testable.
- 3: Mostly clear; minor interpretation possible.
- 2: Understandable but several possible interpretations.
- 1: Vague but some direction can be inferred.
- 0: No clear objective or contradictory.

### 2) Completeness — 0–4
- 4: All required elements present (per chosen template) with full detail.
- 3: Core elements present; minor gaps.
- 2: Several elements missing detail.
- 1: Many gaps; structure incomplete.
- 0: Critical elements missing.

### 3) Efficiency — 0–2
- 2: Maximum information per word; no redundancy.
- 1: Reasonably concise; some repetition.
- 0: Verbose or underspecified.

**Total Score:** __ / 10  
**Thresholds:** 9–10 ship; 7–8 minor edits; 5–6 optimize; <5 rework.

---

## Template-Specific Checks
Apply checks from the template used.
### A) Standard
- [ ] Role & Objective concise, improves task orientation.
- [ ] Agentic Calibration lists Reasoning, Verbosity, Tool use if relevant.
- [ ] Plan Preamble (3–7 bullets).
- [ ] Instructions prioritized; pitfalls noted if relevant.
- [ ] Output format in clear headings.
- [ ] Validation covers objective, completeness, assumptions, self-check.

### B) Essential
- [ ] Objective with success criteria.
- [ ] Key Parameters: Reasoning, Output format, Constraints.
- [ ] Process: 3–4 concise steps to output.
- [ ] Structure lists Parts 1–3.
- [ ] Validation per VR-CORE.

### C) Advanced
- [ ] Role & Objective defines expert role + 2–3 success metrics.
- [ ] Pre-Execution: understanding, challenges, 5–7 step plan, dependencies.
- [ ] Core Instructions: metrics, assumptions, compliance, edge cases, tool policy.
- [ ] Output Architecture: Executive Summary (3–5 bullets + confidence), Main Analysis, Meta-Analysis.
- [ ] Validation: metrics met, edge cases, confidence, coherence.

### D) DeepResearch
- [ ] Role & Objective for research scope & target.
- [ ] Agentic Calibration: Reasoning = high, verbosity level noted.
- [ ] Plan Preamble: scope → search strategy → source quality → data capture → synthesis/conflict handling → validation.
- [ ] Context block filled (Target, Goal, Audience, Scope, Sources, Deliverable).
- [ ] Research Instructions: source standards, synthesis, contradiction handling, citations.
- [ ] Report Structure: TOC + ≥3 sections.
- [ ] Validation: coverage, traceable sources, conflicts resolved, no redundancy.
