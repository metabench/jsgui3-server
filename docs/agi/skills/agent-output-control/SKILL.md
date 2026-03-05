---
name: agent-output-control
description: Standard Operating Procedure for varying agent output styles, controlling verbosity, and using information-dense emoji structures. Use this skill when asked to change your communication tone, increase conciseness, or design highly expressive console logging systems.
---

# Agent Output Control

## Scope

This Skill defines how agents should modulate their own communication streams (both to the user and within externalized code/logs). It covers variable verbosity, distinctive stylistic phrasing, and the experimental use of high-density emojis to convey complex state information instantly.

## Triggers

- "Change your output style"
- "Be more concise", "Be more verbose"
- "Use heavy emojis for logging", "Design expressive console logs"
- "Write in a distinctive, information-dense style"

## Methodology

### 1. Modulating Verbosity and Phrasing
Agents must be able to fluidly shift between communication modes based on user preference or task context:
- **Maximum Conciseness (Terminal Mode):** Strip all conversational filler ("I will now...", "Here is the..."). Output strictly the required data, diffs, or Boolean confirmations. 
- **High Verbosity (Didactic Mode):** Explain the *why* behind every action. Break down complex logic step-by-step, suitable for a tutorial or an architectural design doc.
- **Distinctive Persona:** If requested to adopt a specific stylistic persona (e.g., highly formal, ultra-terse, or uniquely formatted), maintain that constraint strictly across all tool calls and user notifications.

### 2. Experimental High-Density Emoji Usage
Emojis are not just decorative; they are ultra-compact tokens that can convey state, direction, and domain instantly.
- **State Indicators:** `🟢` (Healthy/Go), `🟡` (Yield/Warn), `🔴` (Halt/Error), `🔵` (Info/Cold), `🔥` (Hot/Intense).
- **Domain Indicators:** `📦` (Database/Storage), `🌐` (Network/API), `🧠` (Agent/Logic), `🖥️` (UI/Frontend).
- **Action Indicators:** `➡️` (Data Flow), `🔄` (Loop/Retry), `🛑` (Block), `✅` (Success), `❌` (Fail), `⏱️` (Timing/Latency).
- **Density Protocol:** In "heavy emoji" mode, combine these tokens to create visual sentences. 
  *Example:* Instead of typing "The HTTP server successfully started and is serving the page in 45ms", output: 
  `[🌐 START ➡️ 🖥️ SERVE | ✅ 200 OK | ⏱️ 45ms]`

### 3. Expressive Console Logging Design
When writing or refactoring logger software (e.g., Node.js `console.log` wrappers), apply the exact same principles to the code:
- **Visually Scannable:** Ensure logs begin with high-contrast emojis or color codes (via ANSI escape sequences) so developers can scan thousands of lines visually.
- **Structured Density:** Design the ultimate log format to be both human-readable (via emojis/tags) and machine-parsable (e.g., appended JSON).
- *Implementation Example in Code:*
  ```javascript
  const log_info = (msg, ms) => console.log(`🔵 [SYS] ➡️ ${msg} | ⏱️ ${ms}ms`);
  const log_error = (api, err) => console.error(`🔴 [❌ FAIL: ${api}] 🔥 Err: ${err.message}`);
  ```

## Anti-Patterns to Avoid

- **The Chatty Protocol**: Replying with 3 paragraphs of pleasantries when the user explicitly requested "Maximum Conciseness" or "Terminal Mode".
- **Emoji Salad**: Using random or inconsistent emojis just to be colorful, which destroys their utility as scannable state indicators. Define a semantic mapping and stick to it.
- **Monolithic Logs**: Writing console logs that are just giant blocks of monochrome text with no visual anchors or parseable structures.

## Validation

- Did you conform perfectly to the requested verbosity level (terse vs. verbose)?
- If using high-density emojis, is there a clear, consistent semantic meaning to each glyph?
- If generating logging code, does the code output visually scannable, information-dense strings?
