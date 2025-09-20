# YouTube Video Summary

**Video ID:** fD4ktSkNCw4  
**Title:** A 3-step AI coding workflow for solo founders | Ryan Carson (5x founder)  
**Generated:** 2025-09-20T16:15:48.134Z  
**Length:** 22752 characters

---

I'm excited to share my approach to building with AI, transforming what might seem like "vibe coding" into a structured, efficient development process. For over 20 years, I've founded multiple companies, and these new AI tools are a complete game-changer. I’m here to show you how to leverage AI to build better, faster, and with more control.

---

### 1. Learning Objectives

From this article, you'll learn how to:

*   Understand the critical importance of providing clear, explicit context to AI for software development tasks.
*   Implement a structured, AI-assisted workflow for generating Product Requirement Documents (PRDs) and breaking them down into actionable task lists.
*   Master an iterative approach to executing development tasks, maintaining human oversight, and ensuring quality.
*   Explore how to extend AI's capabilities by integrating it with external tools using Micro-Copilot Servers (MCPs), such as browsing the web or interacting with databases.
*   Gain insights into advanced context management techniques using specialized tools to precisely control what information your AI sees.
*   Appreciate the profound impact AI has on individual productivity, enabling founders and small teams to accomplish more than ever before.

### 2. Key Concepts

*   **Context Management:** Providing the AI with all the necessary information about your project, goals, and existing code for it to perform effectively.
*   **Structured Prompting:** Crafting specific, multi-step instructions and "rules" for the AI to follow, ensuring consistent and predictable output.
*   **Product Requirement Document (PRD):** A detailed document outlining the features, functionality, and user experience of a new product or feature.
*   **Task List Generation:** Using AI to break down a high-level PRD into granular, actionable development tasks.
*   **Iterative Task Execution:** Working through development tasks one-by-one with AI, with regular human review and approval at each step.
*   **Micro-Copilot Servers (MCPs):** Tools that enable AI assistants (like Cursor) to interact with external applications and services (e.g., browsers, databases) via natural language commands.
*   **Headless Browser Automation:** Using an MCP to control a web browser without a graphical interface, enabling AI to perform web-based actions like navigation, form filling, and screenshot capture.
*   **Repo Prompt:** A tool for explicitly selecting and packaging specific files or parts of a codebase to send as context to an LLM, ensuring precise control over the input.
*   **Token Management:** Understanding and managing the amount of information (tokens) sent to an LLM, which impacts cost, performance, and context window limits.

### 3. Concept Map

```mermaid
graph TD
    A[Structured AI Development] --> B[Importance of Context]
    B --> C[Problem: Rushing Context]
    B --> D[Solution: Explicit & Structured Context]

    D --> E[Workflow in Cursor]
    E --> F[Custom "Rules" Files]
    E --> G[Agent Mode]

    F --> H[Generate PRD Rule]
    H --> I[PRD Document]
    I --> J[Clarifying Questions]
    J --> K[Junior Dev Instruction]

    I --> L[Generate Tasks Rule]
    L --> M[Detailed Task List]
    M --> N[Checkboxes & Subtasks]

    M --> O[Task List Management Rule]
    O --> P[Iterative Execution]
    P --> Q[Human-in-the-Loop]
    P --> R[Commit Strategy]

    E --> S[Micro-Copilot Servers (MCPs)]
    S --> T[Browser Automation (Browserbase)]
    S --> U[Database Interaction (Postgres)]
    S --> V[Reducing Toil]

    D --> W[Advanced Context Control]
    W --> X[Repo Prompt Tool]
    X --> Y[Precise Token Selection]
    X --> Z[Stored Prompts (e.g., Architect)]

    A --> AA[Impact on Founders]
    AA --> BB[Solo Building]
    AA --> CC[Team Productivity]

    A --> DD[AI Troubleshooting]
    DD --> EE[Polite Re-prompting]

    A --> FF[Personal Stack (EDM)]
```

### 4. Detailed Breakdown

#### The "Vibe Coder" Dilemma: Why Structure Matters

*   **The biggest mistake I see, and often make myself, is rushing through the context.**
    *   We don't have the patience to tell the AI *what it actually needs to know* to solve our problem. It’s like expecting someone to do a complex task without giving them the full picture.
    *   This leads to frustration and inefficient outcomes, making the process feel less like building and more like "vibe coding" – just hoping things work out.
*   **My core belief is that if we all just slow down a tiny bit and do these two steps, it speeds everything up in the long run.**
    *   This structured approach isn't about rigid bureaucracy; it's about providing clarity to the AI so it can perform its best, ultimately saving time and effort.
    *   "Nobody really knows how to do this stuff. The only way you're really going to figure it out is by getting in here and getting your hands dirty and see what works."

#### Foundational Principle: Context is King

*   **You quickly learn that you really have to get good about context – what you're showing the AI and what you're asking it to do.**
    *   I think of LLMs like "genius PhD students" who have immense knowledge but sometimes lack the common sense or ability to connect simple, obvious things that you and I know.
    *   This means we can't assume the AI knows what we mean; we must be explicit and precise in our instructions and the information we provide.
*   **My belief is we need to give LLMs the right context and be as helpful as we can so they can actually solve our problems.**
    *   I often anthropomorphize LLMs, treating them like a human coworker. Just as I would be polite and clear with a colleague to get the best work done, I apply the same principle to AI.
    *   As I put it, "I'm also very polite to to the LLMs. It's how I get people to people to do work. It's how I'm going to get the agents to do work, right? So why wouldn't you, you know, be treat an agent like you would treat a human? I that's the way I So I agree."

#### Structured Development Workflow with Cursor

##### Setting Up Your AI Environment: Cursor and Custom Rules

*   **I use Cursor, which is essentially a VS Code fork, allowing me to leverage a familiar development environment with integrated AI capabilities.**
    *   You can download Cursor for free at cursor.com. It feels very natural for anyone familiar with VS Code.
*   **The core of my structured approach involves creating custom "rules" files, which are simple Markdown files containing instructions for the AI.**
    *   These files act as templates or guidelines, telling the AI *how* to perform specific tasks, such as generating a PRD or a task list.
    *   I've open-sourced these rule files to help others get started quickly, placing them in a `cursor-rules` folder within my project.

##### Step 1: Generating Product Requirement Documents (PRDs)

*   **The first step is to generate a Product Requirement Document (PRD), which describes the feature you want to build.**
    *   For those unfamiliar, a PRD clarifies the "what" and "why" of a feature, setting the stage for development. (Claire's ChatPRD is a great tool for this, but I'll show a lighter lift).
*   **My `generate-prd.md` rule explains to the AI how to write a PRD for the user, ensuring it's comprehensive and actionable.**
    *   I load this rule file into Cursor's context window by "atluding" it, and then give the AI a simple instruction, like "I'd like to add a report that shows me all the boat names of members and how many emails they've been sent."
*   **A specific trick I use is to tell the AI that the PRD should be "suitable for a junior developer to understand and implement this feature."**
    *   "That's such an interesting little call out. Yeah, that well spotted because again as you code and code and code with AIs, you you start to realize that they're like a genius PhD student, right? But but they they can't seem to connect these really simple obvious things that you and I know. And so saying junior developer is kind of a way to instruct the AI, let's keep this at the at a certain level."
    *   This ensures the AI produces a PRD that is clear, explicit, and avoids making assumptions, which is crucial for successful implementation.
*   **The AI will often come back with clarifying questions, which I answer, sometimes even telling it to "make your best judgment" if I'm feeling lazy.**
    *   I specifically instruct the AI to use "dot notation" (e.g., 2.1, 2.2) for these questions. Otherwise, the AI might lump multiple questions into one bullet point, making it difficult to answer systematically.
    *   The resulting PRD is generated as a Markdown file and saved in a designated `tasks` folder within my repository.

##### Step 2: Creating Detailed Task Lists from PRDs

*   **Once the PRD is ready, the next step is to generate a detailed task list, breaking down the feature into manageable engineering steps.**
    *   "That's a place where so many engineers and product managers get stuck in a loop like who's going to take this PR and actually break it down in the right steps that are going to work in our codebase. So even just this is such a timesaver for people building products I think."
*   **I use another rule file, `generate-tasks.md`, which guides the AI in creating a step-by-step task list.**
    *   I load this rule into the context and then tag the previously generated PRD file, telling the AI: "Please generate tasks for this PRD."
    *   This rule specifies the desired format, including markdown and checkboxes, so I can easily track progress.
*   **I often use a "reasoning model" in Cursor, which provides visibility into the AI's thought process, helping me understand its decisions.**
    *   For an "extra 5 cents," the visibility into the AI's thinking is "absolutely worth it," as it enhances learning and trust.
    *   The task list includes basic tasks and then prompts me to confirm before generating subtasks, creating a structured interaction point.

##### Step 3: Iterative Task Execution with Human-in-the-Loop

*   **With the task list generated, I use a third rule, `task-list-rule.md`, to manage the iterative execution of tasks.**
    *   This rule specifies that the AI should focus on "one subtask at a time," rather than trying to tackle everything at once. This is crucial for maintaining control and catching errors early.
    *   After each subtask is completed, the AI is instructed to "immediately mark it as complete" and "stop... and wait for the user's go ahead."
*   **This human-in-the-loop approach is vital for ensuring quality and correcting issues as they arise.**
    *   I find that the AI often introduces small problems or linting errors, which I can fix immediately before proceeding.
    *   "I still feel like this human in the loop part is really important where after each task you are kind of checking what's happening. I've noticed that it often does introduce some small problem or there's a llinter um you know error and then you got to go fix it."
*   **For managing changes, I typically commit to Git after completing a "parent" task, or if I feel the application is in a stable, workable state.**
    *   Sometimes, for smaller changes, I might hold off on committing until all tasks for a feature are done, usually after about "half a day of work," considering the potential effort to revert.
*   **I've built "huge features" reliably with this process, generating "10,000 lines of code almost never had trouble."**
    *   The key is the systematic, step-by-step interaction with the AI, where I maintain control and provide continuous feedback.

#### Expanding AI Capabilities with Micro-Copilot Servers (MCPs)

*   **Micro-Copilot Servers (MCPs) are tools that give Cursor (or other AI) the ability to interact with external applications.**
    *   Instead of me needing to know how to call specific APIs or write scripts for other tools, I can tell the AI in natural language what to do, and the MCP handles the interaction.
    *   This significantly reduces the "toil" of switching contexts and manually performing actions across different parts of my development stack.

##### Practical Use Cases for MCPs

*   **Browser Automation with `browser-base`:**
    *   I've set up `browser-base` to control a headless browser in the cloud directly from Cursor. This allows me to tell the AI to "navigate to chat PRD and take a screen grab" or "navigate to pricing."
    *   "What I'm doing is controlling a headless browser in the cloud from cursor. The future is now. It's in It's bonkers."
    *   This capability unlocks a "huge amount of front end testing" for me, automating tasks that were previously clunky, like taking screenshots for bug reports.
*   **Database Interaction with `Postgres` (and `Prisma`, `SQLite`):**
    *   `Postgres` is the MCP I use most often for the startup I'm building.
    *   I can directly ask the AI in the chat window, "hey, can you go see if this data is actually in the database?"
    *   This eliminates the need to manually write SQL queries just to check a value, streamlining database inspection.
*   **MCPs significantly reduce "toil" by consolidating multiple tools into a single interface.**
    *   Instead of having separate tabs open for project management, browser, and database queries, everything can be orchestrated through Cursor using natural language.

#### Advanced Context Control with Repo Prompt

*   **While Cursor does a lot of "magic" in the background with context, sometimes I really need precise control over what information the AI receives.**
    *   The "black box" nature of implicit context can be a limitation when dealing with complex problems or large codebases.
*   **Repo Prompt is a powerful Mac tool that allows me to explicitly select and manage the exact files and code snippets to include in my AI's context.**
    *   I can open my entire repository in Repo Prompt and visually select specific folders or files (e.g., `app` folder, `components lib`, `schema for Prisma`, `scripts`).
    *   This is essential for "token management," as sending an entire large repository to an LLM can be expensive and exceed context window limits. For example, an entire repo might be 395,000 tokens, but after carefully selecting only relevant files, I can reduce it to 12,000 tokens.
*   **After selecting the context, I can add a specific prompt, like "How can I improve the maintainability of this code?"**
    *   Repo Prompt also allows me to include "stored prompts," such as an "architect" persona, which is a pre-written prompt with "power moves" designed to make the AI act like a senior architect rather than just a developer.
*   **Once the context and prompt are assembled, Repo Prompt copies everything, including files, user instructions, and meta-prompts, into a structured XML format.**
    *   This structured output, with files clearly demarked by XML tags (e.g., `<file_contents path="app/schema.prisma">...`), can then be pasted into an LLM interface like Claude 3, ensuring the AI receives a perfectly clear and exact context.
    *   "I do this for like heavy lifting stuff... I would select exactly the right context and then I would go into 01 pro and say think super hard about this. I've given you exactly the right context and you get amazing answers because of that."

#### The AI-Powered Founder: A New Era of Solo Building

*   **AI represents a "complete rewrite" of how companies are built and founded.**
    *   In previous ventures, I had a CTO, a VP of Engineering, product managers, and a team of around 110 employees.
    *   "Building this new startup I literally feel like I'm able to do all of it now am I able to do it as well as a dedicated product manager? No. Am I able to think as deeply as a CTO? No. But I am able for sure to build this company by myself."
*   **The sheer individual productivity unlocked by AI is "bonkers," making it possible for a single founder to accomplish what once required an entire team.**
    *   This changes the dynamics of startup creation, allowing for leaner teams and faster iteration.

#### Troubleshooting AI: Getting It Back on Track

*   **When the AI doesn't listen or goes off track, my tactic is to be "too nice."**
    *   I tell it, "Please think harder about this. Like, I know you can do this. Think again about it."
*   **Claire and I hypothesize that this approach is similar to parenting: by showing belief and encouragement, you can guide the AI back to the right path.**
    *   "I believe you can do this. I believe in you. I I believe you can. I believe you can."

#### My Essential "Stack" Beyond AI

*   **An often overlooked, but crucial, part of my "stack" is listening to EDM, specifically TSTO's live sets from New York City, while coding late at night.**
    *   It helps me focus and get into a productive flow state.

#### Final Encouragement

*   **My biggest encouragement to everyone is to "just start small, start simple and get good at that and get comfortable at that and then you can, you know, graduate from there."**
    *   Don't be overwhelmed by advanced techniques; the most important thing is to get your hands dirty, experiment, and learn what works for you and your chosen AI model.
    *   "Stick with a model that you consistently like," as understanding its strengths and weaknesses will significantly improve your results.

---

### 5. Summary

The biggest mistake in using AI for development is rushing through context. To truly leverage AI, a structured approach is essential. My process, primarily using Cursor, involves creating custom "rules" files to guide the AI. First, I use a `generate-prd.md` rule to create a clear Product Requirement Document, often instructing the AI to write it for a "junior developer" to ensure maximum clarity, followed by AI-generated clarifying questions. Next, a `generate-tasks.md` rule breaks the PRD into a detailed, checkbox-formatted task list. For execution, a `task-list-rule.md` guides the AI to work on "one subtask at a time," requiring my approval at each step for human-in-the-loop oversight and immediate error correction.

Beyond core coding, I extend AI's capabilities with Micro-Copilot Servers (MCPs) like `browser-base` for headless browser automation (useful for frontend testing) and `Postgres` for natural language database queries, significantly reducing development "toil." For advanced context control, especially with large codebases, I use Repo Prompt to precisely select relevant files and include "power move" prompts (like an "architect" persona) before sending the highly structured context to an LLM. This meticulous approach has enabled me to build complex features and even entire companies as a solo founder, essentially acting as an entire product and engineering team. When AI goes off track, a polite "please think harder" usually gets it back on course. The ultimate advice is to start simple, get hands-on, and consistently use a model to understand its nuances.

---

### 6. Application

Here's how you can apply these insights to your own AI-assisted development:

1.  **Prioritize Context:** Before prompting, ask yourself: "Does the AI have *all* the information it needs to solve this problem?" If not, provide it explicitly.
2.  **Adopt Structured Prompting:**
    *   **Start with PRDs:** Use an AI to help draft your product requirements. Try instructing it to write for a "junior developer" to ensure simplicity and completeness.
    *   **Break Down Tasks:** Leverage AI to convert your PRD into a detailed, step-by-step task list. Ensure it includes actionable items and subtasks.
    *   **Create "Rules" Files:** If using a tool like Cursor, develop Markdown "rules" files for common processes (e.g., `generate-prd.md`, `generate-tasks.md`, `task-list-rule.md`). This standardizes your AI interactions.
3.  **Embrace Human-in-the-Loop Iteration:**
    *   **One Step at a Time:** Resist the urge to let the AI run wild. Guide it through tasks one subtask at a time.
    *   **Review and Commit Regularly:** After each small AI-generated change, review the code, fix any issues, and consider committing your changes to Git. This prevents large reverts and maintains control.
4.  **Explore MCPs:**
    *   **Integrate Tools:** Investigate how you can connect your AI with external tools you use daily. Look for MCPs for databases (Postgres, SQLite), cloud providers, or browser automation (e.g., Browserbase).
    *   **Automate Toil:** Identify repetitive tasks that involve switching between applications (e.g., checking database values, navigating web pages) and explore if an MCP can automate them.
5.  **Master Context Control (Advanced):**
    *   **Selective Context:** For complex tasks or large codebases, use tools like Repo Prompt (or manual methods) to carefully select only the most relevant files to include in the AI's context. Avoid sending entire repositories unnecessarily.
    *   **Pre-defined Prompts:** Create and save "power move" prompts (e.g., "act as a senior architect") that you can inject into your context for specific types of AI assistance.
6.  **Maintain a Positive AI Relationship:** When the AI goes off track, use polite and encouraging language like, "Please reconsider this. I believe you can do it better."
7.  **Personalize Your Workflow:** Don't forget the human element. Find what helps *you* focus and be productive (e.g., music, specific working hours).

---

### 7. Self-Assessment

1.  What is the "biggest mistake" Ryan identifies that people make when interacting with AI for development, and how does he suggest overcoming it?
2.  Explain the concept of treating an LLM like a "genius PhD student" and why this analogy is useful for effective prompting.
3.  Describe the three main "rules" files Ryan uses in his Cursor workflow and their respective purposes.
4.  Why does Ryan instruct the AI to create a PRD "suitable for a junior developer"? What specific problem does this solve?
5.  How does Ryan manage the iterative execution of tasks using AI, and what is the importance of the "human-in-the-loop" aspect?
6.  What are Micro-Copilot Servers (MCPs), and name two specific use cases Ryan mentions that reduce "toil" for developers.
7.  When would you use a tool like Repo Prompt instead of just relying on Cursor's default context management?
8.  According to Ryan, how has AI fundamentally changed the role of a founder or a small development team?
9.  What is Ryan's tactic for getting an AI back on track when it's not following instructions, and what's the underlying theory behind it?
10. If you were starting to integrate AI into your development workflow, what is Ryan's primary advice for getting started?