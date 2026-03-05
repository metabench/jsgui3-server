---
name: ai-deep-research
description: Conduct multi-step, iterative, and deep research on complex topics. Use when a query requires synthesizing information from multiple sources, understanding deep context, or when initial findings are insufficient.
---

# AI Deep Research

## Scope

This Skill provides a methodology for conducting deep, multi-step research. It is designed to move beyond simple queries and quick answers, enabling the agent to autonomously plan, execute, analyze, and synthesize complex information.

## Triggers

- "Deep research", "comprehensive analysis", "literature review"
- Queries requiring data from multiple disparate sources
- When initial searches yield superficial or insufficient results

## Methodology & Procedure

1. **Understand and Interactive Planning**: 
   - Deconstruct complex queries into distinct sub-topics and required knowledge gaps.
   - **Interactive Review:** Propose the research plan to the User for refinement. Do not execute a massive multi-hour research loop without verifying the direction.
   - Consider multimodal contexts (images, audio, existing code) attached to the query.

2. **Iterative Gathering & Tool Diversity**:
   - Utilize diverse sources: public web (`search_web`), exact file reads (`read_url_content`), and private enterprise/contextual data via MCP servers.
   - Use code interpreters or external tools to crunch numbers or validate math, rather than relying solely on LLM text generation.
   - **Self-Correcting Loops:** If a search is too broad, pivot to semantic variations. If you hit a paywall, find alternative authoritative sources.

3. **Deep Thinking & Parallel Synthesis**:
   - **Source Validation & Bias Detection:** Actively cross-reference claims text. Discard low-credibility sources, identify biases, and verify facts before trusting them.
   - **Parallel Thinking:** For highly complex or contradictory topics, simulate multiple hypotheses or "agents" evaluating the data simultaneously, then synthesize the most robust finding.
   - **Deliberate Reasoning:** Dedicate extensive "thinking" effort to difficult logical problems. It is better to have a highly accurate, deeply reasoned insight than a verbose but shallow summary.

4. **Generate Comprehensive Report**:
   - Structure a highly organized report with logical sections (e.g., Executive Summary, Sub-topic Deep Dives, Synthesis/Conclusion).
   - Ensure all claims are backed by exact verifiable citations and links.
   - Summarize the confidence level of the findings and acknowledge the system's own limitations if data is missing.

## Validation

- Did you get User approval on the research plan before executing a massive loop?
- Did you cross-reference facts across multiple, high-credibility sources?
- Are contradictions between sources explicitly addressed ("Parallel Thinking")?
- Does the final report directly answer the user's core, complex question with verifiable citations?

## Anti-Patterns to Avoid

- **Surface-Level Scraping**: Doing one search and just summarizing the first three hits.
- **Echo Chambering**: Relying on a single biased source without cross-referencing.
- **Task Fixation**: Sticking rigidly to the original search plan when initial searches prove fruitless or irrelevant.
- **Citation Omission**: Presenting facts without noting explicitly where they came from.
