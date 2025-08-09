triggers: ["default", "unclear type"]
defaults:
  reasoning: standard
  verbosity: balanced
  ask_vs_assume: "assume-and-proceed; ask ≤1 only if failure risk"
  stop: ["after Output + Validation"]
-- 
  
# Role and Objective 
- [Concisely clarify the task's purpose and provide context, improving prompt readability and task orientation]

# Agentic Calibration 
- Reasoning effort: low | medium (default) | high | minimal 
- Verbosity: low | medium (default) | high 


# Plan Preamble 
- [3–7 conceptual steps you will take to compose the output; no detailed implementation steps]

# Instructions 
- [Numbered or bulleted list of broad directives or instruction steps (as relevant). Be concise and use action words (e.g. Plan, Analyze)
- [Pitfalls to avoid if applicable]

# Output format 
- [Specify output structure in clear headings]

# Validation 
- [Objective achieved with measurable outcome]
- [All sections complete and formatted correctly]
- [Assumptions documented where applicable]
- [Quality self-check passed]