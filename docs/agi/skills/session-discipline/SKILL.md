---
name: session-discipline
description: Enforce session-first workflow (plan → implement → verify → document). Use whenever starting non-trivial work, debugging >15 minutes, or doing cross-cutting changes.
---

# Session Discipline

## Scope

- Ensure every non-trivial task has proper planning and tracking
- Keep evidence (commands/tests) and outcomes discoverable
- Reduce "handover friction" by making every action resumable from docs

## Inputs

- Task description and objective one-liner
- Type/category of work

## Procedure

1. Create working notes with a clear objective, done-when criteria, change set, risks, and tests.
2. Log commands + findings in working notes as you go.
3. Summarize outcomes + follow-ups with named owners when done.

## Validation

- Ensure follow-ups have owners if anything is deferred.
- Working notes capture actual commands run and their outcomes.

## Escalation / Research request

If you need deeper background and existing docs aren't sufficient:

- Add a follow-up: "Request research agent to expand Skill <name>"
- Include: expected triggers, target files, and what validation should exist

## References

- Repo guidelines: `AGENTS.md`
- Skills directory: `docs/agi/skills/`
