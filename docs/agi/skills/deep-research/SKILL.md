---
name: deep-research
description: Conduct deep, multi-step research on a topic using iterative search-evaluate-refine loops with deep thinking reasoning. Use when you need comprehensive understanding of a topic, technology, or problem space — not just a quick answer.
---

# Skill: Deep Research (with Deep Thinking Reasoning)

## Scope

Use this Skill when you need to **deeply understand a topic** — not just find a quick answer, but build comprehensive, validated knowledge:

- You need to research a technology, architecture, or design pattern in depth.
- You need to compare approaches and make an evidence-based recommendation.
- You need to produce a detailed report, book chapter, specification, or analysis.
- You need to investigate a problem space where the first answer is probably incomplete.
- You want to combine information from multiple sources into a coherent synthesis.

This is the research equivalent of "think hard before answering." It is **not** for quick lookups — use normal web search for those.

## Core Principles

### 1. Think Before You Search

Before any search, articulate:
- **What do I already know** about this topic?
- **What are my knowledge gaps?** (Be honest about uncertainty)
- **What specific questions** would fill those gaps?
- **What assumptions am I making?** (Write them down — see Key Assumptions Check below)

### 2. Search Wide, Then Deep (Progressive Deepening)

```
Round 1: Broad landscape scan
  → "What is X? How does X work? X overview"
  → Goal: Identify the key concepts, players, and terminology

Round 2: Targeted investigation
  → "X vs Y comparison", "X architecture internals", "X best practices"
  → Goal: Understand the mechanics, trade-offs, and expert opinions

Round 3: Deep dives on specifics
  → "X edge cases", "X implementation gotchas", "X academic paper"
  → Goal: Fill remaining gaps, find contrarian views, verify claims

Round 4 (if needed): Adversarial search
  → "X criticisms", "X failures", "why X is bad", "X alternatives"
  → Goal: Stress-test your conclusions with disconfirming evidence
```

### 3. Grade Your Evidence

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| **A** | **High** | Primary source, authoritative, current | Official docs, author's blog, peer-reviewed paper, source code |
| **B** | **Moderate** | Credible secondary source, well-reasoned | Reputable tech blog, conference talk, well-cited Stack Overflow |
| **C** | **Low** | Unverified or potentially outdated | Random blog post, forum comment, undated article |
| **D** | **Very Low** | Anecdotal, potentially unreliable | Social media, AI-generated content, marketing material |

### 4. Reason Deeply Between Searches (Deep Thinking)

After each search round, **stop and think**:
- What did I learn that I didn't know before?
- What contradictions or surprises did I find?
- What is still unclear or unconfirmed?
- Have my initial assumptions changed?
- What should I search for next?

## Procedure

### Phase 0 — Frame the Research
1. **State the research objective** in one sentence.
2. **List what you already know** (even if tentative).
3. **List 3–5 specific questions** you need answered.
4. **Perform a Key Assumptions Check** (KAC).
5. **Define the output format**: report, comparison table, specification, etc.
6. **Set a depth budget**: how many search rounds are appropriate? (Typically 3–5)

### Phase 1 — Landscape Scan (Broad)
1. Run 2–3 broad web searches with different phrasings.
2. Read the top results. Skim for structure, not detail.
3. **Pause and reason**.
4. **Build an evidence map**.
5. Update your question list.

### Phase 2 — Targeted Investigation (Focused)
1. Search for specific sub-topics identified in Phase 1.
2. Read primary sources when possible.
3. **Grade each source** using the evidence grading scale.
4. **Pause and reason**.
5. Start building your synthesis outline.

### Phase 3 — Deep Dives (Specific)
1. Search for specific unanswered questions from Phase 2.
2. **Actively look for disconfirming evidence**.
3. Check for recent developments.
4. Read code, specifications, or academic sources if relevant.
5. **Pause and reason**.

### Phase 4 — Synthesis (Deep Thinking)
1. **Organise your findings** into a coherent structure.
2. **Cross-reference claims**.
3. **Identify your own reasoning gaps**.
4. **Apply reasoning techniques**: Chain of Thought, Tree of Thought, Analysis of Competing Hypotheses, Self-Reflection.
5. **Perform a sensitivity analysis**.
6. **Write the output** with proper sourcing and confidence levels.

### Phase 5 — Validate and Refine
1. Re-read the original research objective. Does the output answer it fully?
2. Check for logical consistency.
3. Check for completeness.
4. Check for accuracy — are specific claims sourced?
5. **Run a bias audit**.

## Deep Thinking Reasoning Toolkit

- **Chain of Thought (CoT)**: Break complex reasoning into explicit steps.
- **Recursive Thought Expansion (RTE)**: When a step is ambiguous, expand it into its own sub-chain.
- **Tree of Thought (ToT)**: Explore multiple reasoning paths, evaluate, prune.
- **Graph of Thought (GoT)**: When reasoning is non-linear — ideas from different branches inform each other.
- **Analysis of Competing Hypotheses (ACH)**: Evaluate evidence against multiple hypotheses systematically.
- **Self-Consistency**: Generate the same conclusion via 3+ independent reasoning paths.
- **Self-Reflection Loop**: Critique → Identify assumptions → Challenge → Refine.
- **Adversarial Thinking (Red Team)**: Deliberately argue against your own conclusions.

## Cognitive Bias Watchlist

| Bias | How to Counter It |
|------|-------------------|
| **Confirmation bias** | Actively search for disconfirming evidence |
| **Anchoring** | List questions before reading first source |
| **Availability heuristic** | Use data and counts, not memorable anecdotes |
| **Authority bias** | Even authoritative sources can be wrong — cross-validate |
| **Satisficing** | Check: have I answered all original questions? |
| **Groupthink** | Trace claims to origin — 5 blogs quoting 1 paper = 1 source |

## Anti-Patterns to Avoid

| Anti-Pattern | Instead |
|-------------|---------|
| **Search-and-paste** | Pause and think after every search round |
| **First-result bias** | Cross-reference with 2+ sources |
| **Depth without breadth** | Always do Phase 1 before Phase 3 |
| **Premature synthesis** | Complete at least 3 search rounds first |
| **Citation-free claims** | If you can't cite it, flag it as uncertain |

## Stopping Rules

Stop researching when:
- You've completed your planned search rounds (3–5).
- New searches are returning information you've already seen (saturation).
- You can confidently answer all your original questions.

## References

- `docs/agi/skills/session-discipline/SKILL.md` — for session tracking
- `docs/agi/skills/instruction-adherence/SKILL.md` — for staying on objective
