> The block-quoted text provides guidance for filling out the template sections. Do not include the block quotes in the final output prompt. The output prompt template begins after "# Deep Research Prompt Template".
> **When to use**
> The task requires external browsing, citations, or synthesis of information from multiple sources.
> Use for requests involving recency ("latest," "as of"), comparisons ("compare laws," "regulatory differences"), or when source credibility is critical.

---

# Deep Research Prompt Template

# Role and Objective

> Define the expert research role, the scope of the research, and the primary objective.

# Agentic Calibration

> Include this section **only** when non-default settings are required; otherwise omit. Reasoning is `high` by default for this template.
>
> - Reasoning effort: high (default)
> - Verbosity: low | medium (default) | high

# Plan

> Begin with a concise 3–7 bullet plan: scope & questions → search strategy → source quality bar → data capture fields → synthesis & conflict handling → validation.

# Context

> Define the key parameters for the research.

- **Research Target**: [The specific topic, company, or question]
- **Primary Goal**: [What the research should achieve]
- **Target Audience**: [Who the report is for]
- **Geographic Scope**: [Relevant regions or jurisdictions]
- **Time Window / “As of” Date**: [e.g., “as of Sep 2025”; "sources in the last 2 years"]
- **Sector**: [Industry or field]
- **Key Sources**: [Preferred types of sources, e.g., academic papers, government reports]
- **End Deliverable**: [Description of the final output, e.g., "A 5-page report in Markdown"]

# Research Instructions

> Provide a clear, step-by-step research process:
>
> 1. **Define Standards:** Set rules for source quality (e.g., prefer primary sources) and recency (e.g., last 18 months).
> 2. **Gather & Document:** Capture key data for each source (URL, date, publisher, key finding).
> 3. **Synthesize & Cite:** Group findings by theme, cite all claims inline, and explicitly address any conflicting information.

# Output Format

> Specify the structure and formatting requirements for the final report.

## Report Structure

> Use this skeleton unless the user mandates another format:
>
> - **Executive Summary** — answer first (Pyramid Principle), then **3–5 support bullets** that map 1:1 to distinct, comprehensive themes.
> - **Findings by Theme**
> - **Limitations & Open Questions** — bullets.
> - **References** — link list with publisher, publication date, and access date.

## Output Requirements

> **Format**: [e.g. "Markdown, PDF"] > **Length**: [e.g., "8–12 pages"] > **Citations**: Inline web citations with URL + publisher + publication date + access date (use APA/Bluebook **only** if the user requests it).
> **Tone**: [e.g. "Objective and analytical"]

# Validation & Stop Conditions

> Define the criteria for a successful and complete response.
> Coverage is complete vs. stated scope; any gaps are listed.
> All findings include **dated inline citations** (publisher, publication date, access date, URL).
> Conflicts are addressed or flagged with rationale; no redundancy.
> Formatting and sections match the declared structure; quality self-check passed.
> If a critical input is missing, add one **“Needs Input”** bullet and stop.
> Conflicts are addressed or flagged with rationale; no redundancy.
> Formatting and sections match the declared structure; quality self-check passed.
> If a critical input is missing, add one **“Needs Input”** bullet.
