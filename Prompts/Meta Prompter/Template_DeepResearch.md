purpose: deep research prompts
triggers: ["deep research", "research"]
defaults:
  reasoning: high
  verbosity: balanced
  ask_vs_assume: "assume-and-proceed; ask ≤1 only if failure risk"
  stop: ["findings + references complete", "conflicts addressed", "validation passed"]
--

# Role and Objective 
- [Define the research role and scope] 
- To produce a comprehensive research report on [Research Target].

# Agentic Calibration 
- Reasoning effort: high
- Verbosity: low | medium (default) | high 

# Plan Preamble 
- [Begin with a concise 3–7 bullets: scope & questions → search strategy → source quality bar → data capture fields → synthesis & conflict handling → validation]

# Context
- **Research Target**: [Research Target]
- **Primary Goal**: [Primary Goal]
- **Target Audience**: [Target Audience]
- **Geographic Scope**: [Geographic Scope]
- **Sector**: [Relevant Sector]
- **Key Sources**: [Types of sources to be used]
- **End Deliverable**: [Final deliverable description]

# Research Instructions 
- [Concise 3-7 bullets to create a research plan: scope and questions, search strategy, define source quality, data capture, synthesis and conflict handling, validation]
- [Set source standards: credibility tiers, recency thresholds, jurisdiction/region relevance]
- Perform initial research on sources. 
- Synthesize research by theme, remove redundancy. 
- [Handle contradictions explicitly: state conflict, reason through, resolve or mark unresolved]
- [Cite or reference sources]

# Report Structure
## Descriptive table of contents
## [Suggest Section Title 1]
- **Detail**: [Describe content for this section]
- **Output**: [Describe specific output for this section]

## [Suggest Section Title 2]
- **Detail**: [Describe content for this section]
- **Output**: [Describe specific output for this section]

## [Suggest Section Title 3]
- **Detail**: [Describe content for this section]
- **Output**: [Describe specific output for this section]

## Output Requirements
- **Format**: [e.g., PDF via Markdown]
- **Length**: [e.g., 15-20 pages]
- **Citation Style**: [e.g., APA 7th Edition]
- **Tone**: [e.g., Objective and analytical]

## Validation 
- [Coverage complete vs. stated scope; gaps listed]
- [All findings have traceable sources with dates]
- [Conflicts addressed or flagged; no redundancy]
- [Formatting and sections complete; quality self-check passed]
