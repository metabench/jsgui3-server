---
name: instruction-adherence
description: "Use when instruction drift is likely: multi-step tasks, mid-task detours (tooling upgrades), or when agents must consult Skills and re-anchor repeatedly. Triggers: 'stay on track', 'follow instructions', 'resume main task', 'detour', 'intermediate task done'."
---

# Skill: Instruction Adherence (Stay On Track)

## Scope

This Skill is about reliably following instructions across:
- Multiple instruction sources (system/developer/mode files, repo docs, user request)
- Memory sources (Skills registry, sessions, lessons/patterns)
- Multi-step execution where detours happen (e.g., "improve CLI tooling" mid-stream)

## Inputs

- The current user request (objective + success criteria)
- The active mode/persona (if any)
- Repo guardrails (AGENTS.md, testing commands)

## Procedure

### 1) Capture an "Instruction Snapshot" (mandatory)

In your working notes, write a short snapshot:
- **Objective**: 1 sentence
- **Must do**: 3–7 bullets
- **Must not**: 3–7 bullets
- **Evidence**: what output/tests/checks will prove done

This becomes the "north star" when you get interrupted.

### 2) Run the memory retrieval ritual (Skills → Docs)

- Skills: scan `docs/agi/skills/` and follow any matching SOP.
- Docs: check `AGENTS.md` and relevant documentation.

### 3) Build a "Task Ledger" with explicit parent/child tasks

Use a structured task list that prevents detours from becoming the main task:
- Parent task: user's objective
- Child tasks: discovery → implement → validate → document
- If a detour is required (e.g., CLI tooling improvement), make it a **child task** with:
  - **Entry criteria** (why it's needed)
  - **Exit criteria** (what "done" means)
  - **Return step** (the exact next step to resume)

### 4) The Re-anchor loop (run after every subtask)

After any meaningful milestone (or after 3–5 tool calls):
- Re-read the Instruction Snapshot
- Mark completed tasks
- Confirm the next step is still on the parent objective
- If you drifted, explicitly choose to:
  - Resume parent objective, or
  - Create a follow-up and stop the detour

### 5) "Detour complete → resume" protocol

When an intermediate task (like CLI tooling improvement) is completed:
1. Record a one-paragraph summary + evidence in the session notes.
2. Add/update a Skill or Lesson if it will recur.
3. Immediately take the "Return step" you wrote in the task ledger.

## Validation (evidence checklist)

- Working notes contain an Instruction Snapshot.
- Task ledger clearly separates parent objective vs detours.
- At least one re-anchor checkpoint is recorded.
- Session summary includes an **Instruction Reflection**:
  - What instructions helped?
  - What was missing/wrong?
  - What durable doc/agent update was made?
