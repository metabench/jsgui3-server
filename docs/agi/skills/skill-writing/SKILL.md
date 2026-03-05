---
name: skill-writing
description: "Write excellent Antigravity Skills — reusable capability packs with trigger phrases, SOPs, and validation. Use when creating a new Skill, improving an existing one, or auditing skill quality. Triggers: write a skill, new skill, create skill, skill review, improve skill, skill quality."
---

# Skill: Writing Excellent Antigravity Skills

## Scope

Use this Skill when you need to:

- **Create a new Skill** from scratch (or from session learnings)
- **Upgrade an existing Skill** that's thin, outdated, or missing key sections
- **Audit skill quality** across the registry
- **Extract a Skill** from a successful session or workflow

This is a meta-skill: it teaches how to write Skills that teach agents to do things well.

Out of scope:
- Writing *workflows* (`.agent/workflows/`) — those are sequential checklists, not capability packs
- Writing *lessons* or *patterns* — those are distilled one-liners, not SOPs

## Core Principle: A Skill Is a Decision-Making Machine

> **A good Skill doesn't just tell the agent *what to do* — it tells the agent *what to think about* while doing it.**

The difference between a weak Skill and a strong one:

| Weak Skill | Strong Skill |
|-----------|-------------|
| "Run these 5 commands" | "Here's the mental model. Here are the commands. Here's how to tell if they worked. Here's what to do when they don't." |
| Agent follows steps blindly | Agent *reasons* about the domain and adapts |
| Breaks when reality deviates | Handles edge cases because the agent understands *why* |

## Mental Model: The Skill Quality Pyramid

```
                    ┌─────────────┐
                    │  MENTAL     │  ← The agent can reason about WHY
                    │  MODELS     │     (principles, heuristics, trade-offs)
                    ├─────────────┤
                    │  DECISION   │  ← The agent knows WHEN to do what
                    │  POINTS     │     (if X → do A, if Y → do B)
                    ├─────────────┤
                    │  CONCRETE   │  ← The agent knows HOW
                    │  ACTIONS    │     (commands, code patterns, API calls)
                    ├─────────────┤
                    │  GUARD      │  ← The agent knows when to STOP
                    │  RAILS      │     (anti-patterns, stopping rules, escalation)
                    └─────────────┘
```

**Level 1 (Actions only)** — the agent can follow the steps. Fragile.
**Level 2 (Actions + Decisions)** — the agent can handle branching. Better.
**Level 3 (Actions + Decisions + Mental Models)** — the agent can adapt. Strong.
**Level 4 (All four layers)** — the agent can self-correct. Excellent.

Your goal: write Level 3–4 Skills.

---

## Procedure

### Phase 0 — Decide If This Should Be a Skill

Not everything deserves a Skill. Use this decision tree:

```
Is this a repeatable capability (not a one-off task)?
├── No → Write a session note or follow-up instead
└── Yes
    ├── Is it a simple checklist with no branching logic?
    │   ├── Yes → Write a workflow (`.agent/workflows/`)
    │   └── No
    │       └── Does it require domain reasoning or decision-making?
    │           ├── Yes → WRITE A SKILL ✓
    │           └── No → Consider a pattern
```

### Phase 1 — Deep Research Before Writing

**Never write a Skill from scratch.** Always research first:

1. **Check for existing Skills** that overlap
2. **Mine session history** for the source material
3. **Identify the core mental model**
4. **Identify anti-patterns**

### Phase 2 — Design the Skill Structure

Every Skill MUST have these sections (the **Mandatory Six**):

| Section | Purpose | Quality Test |
|---------|---------|-------------|
| **Frontmatter** | Discovery — when should this Skill activate? | Would a search for any related keyword find this Skill? |
| **Scope** | Boundaries — what does/doesn't this Skill cover? | Could an agent confidently decide "this Skill applies" or "this Skill doesn't apply"? |
| **Inputs** | Prerequisites — what info does the agent need? | If the agent doesn't have these inputs, would it know to ask? |
| **Procedure** | The SOP — step-by-step with decision points | Could an agent follow this without asking for help on the happy path? |
| **Validation** | Proof — how does the agent verify the work? | Are there specific commands with expected outputs? |
| **References** | Pointers — related docs, tools, skills | Would an agent know where to go for deeper context? |

### Phase 3 — Write the Frontmatter (Most Important Part)

```yaml
---
name: my-skill-name
description: "Verb-first description of what the skill does and WHEN to use it. Include trigger phrases."
---
```

**Rules for great frontmatter:**

1. **Name**: lowercase, hyphenated, 2-4 words. Self-explanatory without reading the description.
2. **Description**: Must answer TWO questions in a single sentence:
   - What does this Skill **do**? (verb-first: "Diagnose...", "Write...", "Debug...")
   - When should an agent **use** it? (situation triggers)
3. **Trigger phrases**: Include exact words a user or agent would use.

### Phase 4 — Write the Procedure

Follow these writing principles:

1. **Use imperative voice** ("Run this command", not "The agent should run")
2. **Number the steps**
3. **Include decision points inline**
4. **Show exact commands**
5. **Explain WHY alongside WHAT**
6. **Include concrete thresholds** when applicable
7. **Keep the Skill under 500 lines.**

### Phase 5 — Write Anti-Patterns

Good anti-patterns are:
- **Named** (so they can be referenced in conversation)
- **Grounded** in real experience
- **Specific** about cost

### Phase 6 — Write Validation and Escalation

**Validation** answers: "How does the agent know the Skill worked?"
**Escalation** answers: "When should the agent stop and ask for help?"

Both must be concrete. Avoid "if something goes wrong" — specify *what*.

---

## Quality Audit Checklist

| # | Check | Pass? |
|---|-------|-------|
| 1 | Frontmatter has verb-first description with trigger phrases | |
| 2 | Scope clearly separates in-scope from out-of-scope | |
| 3 | Inputs lists what the agent needs before starting | |
| 4 | Procedure uses numbered steps with inline decision points | |
| 5 | Procedure shows exact commands (not abstract descriptions) | |
| 6 | Procedure explains WHY alongside WHAT | |
| 7 | Validation has concrete commands with expected outputs | |
| 8 | References points to related docs, tools, and Skills | |
| 9 | Mental model names the core thinking pattern (if applicable) | |
| 10 | Anti-patterns listed with names, costs, and alternatives | |
| 11 | Escalation criteria are specific (not "if something goes wrong") | |
| 12 | Under 500 lines (deeper content in references/) | |

**Scoring:** 10-12 Excellent · 7-9 Good · 4-6 Needs work · 1-3 Stub

---

## Anti-Patterns to Avoid

### ❌ The Checklist Masquerading as a Skill
**Symptom:** Skill is just a numbered list of commands with no decision logic.
**Fix:** Add decision points, WHY explanations, and a mental model section.

### ❌ The Encyclopaedia
**Symptom:** Skill is 800+ lines and tries to cover every scenario.
**Fix:** Keep SKILL.md under 500 lines. Put deep reference in `references/` files.

### ❌ The Vague Oracle
**Symptom:** Skill uses "use your judgment", "handle appropriately", "investigate as needed".
**Fix:** Replace every vague phrase with a concrete criterion, threshold, or decision point.

### ❌ The Island Skill
**Symptom:** Skill doesn't reference any other Skills.
**Fix:** Add an Integration section naming related Skills and when to chain them.

### ❌ Trigger Poverty
**Symptom:** Frontmatter has a generic description and 1-2 trigger phrases.
**Fix:** Add 5-10 trigger phrases covering problem-phrasing, task-phrasing, domain terms, and error messages.

---

## Validation

After writing a Skill:

1. **Frontmatter search test:** Search for 3 different trigger phrases. Does the Skill appear?
2. **Cold-start test:** Could an agent encountering this domain for the first time follow the Skill without asking for help?
3. **Edge-case test:** Does the Skill handle the most common failure mode?
4. **Audit checklist:** Score using the Quality Audit Checklist. Target 10+.

## Escalation

- If unsure whether to write a Skill vs. workflow vs. pattern: default to Skill if it requires judgment calls, workflow if it's a pure checklist
- If the Skill's domain is unfamiliar: use `deep-research` first to build understanding

## References

- Skills directory: `docs/agi/skills/`
- Exemplar Skills (study these):
  - `docs/agi/skills/deep-research/SKILL.md` — authoritative, reasoning toolkit
  - `docs/agi/skills/runaway-process-guard/SKILL.md` — tactical, guard-rail focused
