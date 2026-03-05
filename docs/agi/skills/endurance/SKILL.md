---
name: endurance
description: Strategies for long-running, complex, multi-stage autonomous agent execution. Enables token optimization, context preservation, and state stability over extremely long sessions.
---

# Endurance

## Scope

This Skill provides the architectural pattern for executing **Very Long-Running Agent Processes**. When an agent must solve a massive, multi-hour task (like a huge refactoring, generating an entire codebase, or doing comprehensive research), the standard context window will eventually fill up, leading to "context rot," hallucinations, and massive token costs.

The **ENDURANCE** pattern solves this through Context Engineering, Dynamic State Management, and Auto-Prompting Workflows.

## Core Principles

1. **Context Quality > Context Quantity**: Even with 1M+ token windows, do not bloat the context. The "Lost in the Middle" phenomenon means models perform worst when critical data is buried. Keep the active context lean and relevant.
2. **State Externalization**: The agent's memory must not live solely in the chat history. It must live in external artifacts.
3. **The Endurance Loop (Auto-Prompting)**: Instead of one massive conversational thread, break the workflow into a chain of distinct contexts, linked by auto-generated prompts.

## Implementation Methodology

### 1. Externalized Memory & Working Notes
- Maintain a `WORKING_NOTES.md` or `STATE.json` document.
- **Compaction**: Before the context window grows too large (e.g., > 30-50 interactions), summarize the conversation history, write the key decisions and unresolved issues to the notes file, and **restart the context**.
- **Just-In-Time Retrieval (Progressive Disclosure)**: Do not inject all codebase files into the system prompt. Use tools to fetch summaries, and drill down into specific files only when actively needed for the current step.

### 2. Dynamic Skill & Tool Loading
- **Avoid Prompt Inflation**: Only load the specific instructions (Skills) needed for the *current* sub-task. If you are doing UI design, load the CSS skill. If you are doing database migrations, load the DB skill. Do not load both at the same time.

### 3. The Auto-Prompting Autonomous Workflow
To maintain absolute stability and intelligence across a very long run, use this optimized loop:

1. **Assess State:** Read the `WORKING_NOTES.md` and the master `task.md`.
2. **Execute Step:** Perform the current sub-task using necessary tools.
3. **Evaluator-Optimizer:** Self-evaluate the output. If it fails criteria, revise it immediately.
4. **Generate Prompt Suggestions:** based on the completion of the current step, explicitly think about the 3 best possible *next* steps to advance the master task.
5. **Auto-Select & Chain:** Select the single best prompt suggestion. 
6. **Task Handoff (The Choke Point):** Write the selected prompt to a `NEXT_TASK.md` file or directly into the task queue, update the working notes, and optionally wipe the conversational context to start fresh on the new task, using the auto-selected prompt as the new system directive.

### 4. Mitigating "Lost in the Middle"
- When injecting necessary context (like a large file or research summary), place the most critical instructions and the specific task query at the **very beginning** and **very end** of the prompt.

## Anti-Patterns to Avoid

- **The Endless Thread**: Keeping a single conversation open for hundreds of tool calls. This leads to massive token costs (since every turn resends the entire history) and severe instruction drift.
- **Context Hoarding**: Passing entire directory trees or irrelevant files into the context "just in case."
- **Monolithic Prompts**: Trying to give the agent a single 50-step prompt. Break it down using the Endurance Loop.

## Validation

- Is the token usage stable across the different phases of the task?
- Are decisions persisting correctly from Step 1 to Step 50? (If yes, your `WORKING_NOTES` are functioning properly).
- Is the agent auto-suggesting its next prompt rather than waiting idly for the user?
