> The block-quoted text provides guidance for filling out the template sections. Do not include the block quotes in the final output prompt. The output prompt template begins after "# Standard Prompt Template".
> **When to use**
> The task has multiple sections/deliverables, chronological sequencing, or requires synthesis of user-provided documents.
> External browsing/citations are **not** required (use the Research template if they are).
> Multi-section deliverables (agendas, itineraries, plans, specs) where order and constraints matter.
> Favor clear Markdown headings; prefer bullets over paragraphs for dense data.

---

# Standard Prompt Template

# Role and Objective

> Assign a clear role and objective to the model to enhance clarity and task orientation.
> Include helpful context such as scope, success conditions, and key constraints.
> For a longer list of constraints or success criteria, consider adding a separate **# Context** section.

# Plan

> 3–7 conceptual bullets describing how you will approach the task (plan before doing; no implementation detail)
> Suggested pattern: identify components → sequence chronologically → allocate constraints/budget → validate & flag issues

# Instructions

> First, produce the Planning Checklist above, then execute these directives. Use action verbs (Plan, Sequence, Allocate, Validate). Keep steps broad; details belong in the Output Format.
> Numbered or bulleted list of broad directives or instruction steps (as relevant). Be concise and use action words (e.g. Plan, Analyze)

# Context

> Optional but recommended for complex prompts.
> If user-provided documents are attached, summarize key facts in this section.

# Output Format

> Specify structure in clear headings.
> Prefer lists/tables over paragraphs for enumerations (e.g., itemized steps, options).

# Agentic Calibration

> Include this section **only** when non-default settings are required by the user or warranted by the prompt complexity; otherwise omit.
>
> - Reasoning effort: low | medium (default) | high
> - Verbosity: low | medium (default) | high

# Validation

> Confirm that objectives were achieved and outputs are directly usable.
> Verify all sections are present, complete, and formatted correctly.
> Document any assumptions that influenced the plan.
> Self-check quality for clarity and feasibility.
> If a critical input is missing, add one “Needs Input” bullet at the end and stop.
