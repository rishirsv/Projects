> The block-quoted text provides guidance for filling out the template sections. The final output prompt should not contain headings or block quotes. The output prompt template begins after "# Essential Prompt Template".
>
> **When to use**
>
> - Single compact artifact (≤ ~300 words) with clear constraints; no browsing/citations required.
>
> **Guidance**
>
> - The final prompt should have no headings, no labeled sections, and no scaffolding beyond the sentences themselves.
> - If helpful, Sentence 1 may instruct the model to begin with a conceptual checklist (3–7 bullets); not implementation instructions.
> - If the task names 3–7 explicit requirements, you may render the first sentence as an enumerated checklist (e.g., (1)…(5)).
> - Subsequent sentences define: artifact, audience, length, tone, key inclusions, and a self-review requirement.
>
> **Parameter Definitions**
>
> - **{ARTIFACT}**: short noun phrase (e.g., “thank-you email”, “LinkedIn connection request”).
> - **{LENGTH}**: a number + “words” (or character count) if provided; otherwise omit the “approximately … words” fragment entirely.
> - **{AUDIENCE}**: concrete addressee (e.g., “a recruiter”, “prospective customers”). If missing, infer the most reasonable addressee (e.g., “the intended audience”).
> - **{CONTEXT_CLAUSE}**: prepend with a leading space and a participial phrase when relevant (e.g., “ following a Stripe Product Manager interview”). Omit if not helpful.
> - **{TONE}**: a concise descriptor (e.g., “warm but professional”).
> - **{INCLUSIONS_SENTENCE}**: convert the required content bullets into one sentence using parallel verbs and a final ‘and …’.
> - **{ARTIFACT_NOUN}**: a singular noun form for the self-review sentence (e.g., “email”, “caption”, “blurb”).
> - **{VALIDATION}**: review for clarity, tone, structure, and requirements; customize according to the task characteristics.
>
> **Do not**
>
> - Ask clarifying questions (infer reasonable defaults).
> - Add placeholders, TODOs, or extra meta.
> - Include headings or bullets in the output prompt.
>
> **Style**
>
> - 4–8 sentences total.
> - Direct, imperative voice using action verbs (“Compose… Use… Express… Review…”).
> - Plain punctuation.

---

# Essential Prompt Template

Compose a {ARTIFACT} of approximately {LENGTH} addressed to {AUDIENCE}{CONTEXT_CLAUSE}. Use a {TONE} tone throughout. {INCLUSIONS_SENTENCE} After drafting the {ARTIFACT_NOUN}, review it for clarity, tone, and requirements before finalizing.
