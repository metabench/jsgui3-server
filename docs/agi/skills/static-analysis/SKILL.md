---
name: static-analysis
description: Standard Operating Procedure for utilizing linters, type checkers, and AST-driven tools as a self-correction feedback loop. Use this skill to validate code correctness, ensure structural compliance, and debug complex type or structural issues in vanilla jsgui3 packages.
---

# Static Analysis & AST-Driven Self-Correction

## Scope

This Skill defines how autonomous agents must use static analysis (linters, structural checks) not just as a final validation step, but as the primary engine for **iterative self-correction**. 

Unlike human developers who use linters to catch typos, AI agents must use Abstract Syntax Tree (AST) validation as a deterministic "guardrail" against hallucinated APIs, incorrect type assumptions, and structural deviations.

## Triggers

- "Run static analysis" or "Lint the codebase"
- "Check for errors"
- Writing or refactoring any code in `jsgui3-server` or `jsgui3-html`
- Recurring failures in execution where the code *looks* right but fails at runtime.

## Core Principles: The AI Feedback Loop

1. **The AST Advantage:** AI LLMs operate on text probability, which means they can easily invent plausible-sounding but non-existent methods. Static analysis tools evaluate the **Abstract Syntax Tree (AST)**—the actual logical structure of the code. **Always trust the AST over your own baseline assumptions.**
2. **Iterative Self-Correction:** When modifying code, do not immediately report success to the user. You must:
   * Generate the code change.
   * Run the available static analysis tools (e.g., ESLint, or custom check scripts).
   * If the tools return errors, **read the exact error output**, use it to modify the code, and run the tools again.
   * Only exit the loop when the static analysis passes cleanly.
3. **Augmentation, Not Isolation:** Static analysis catches deterministic structural errors, but it does not run the code. You must augment static analysis with targeted testing (`npm test`) to verify behavioral logic.

## Execution Methodology

### Strategy: Vanilla JS Packages (jsgui3-server, jsgui3-html)
`jsgui3` is an Isomorphic Object-Oriented DOM Wrapper written in vanilla JS. Standard linters (like ESLint) are often less effective here because the behavior is highly dynamic and event-driven.

1. **The Primary Tools:** Rely on structural and behavioral checks:
   - Run the test suite: `npm test`
   - For specific module validation, use smoke tests:
     ```bash
     node -e "require('./server'); console.log('OK')"
     ```
   - Check for existing test files in `tests/` near the changed code.

2. **Resolution Protocol:**
   - Look for standard `jsgui3` structural anti-patterns manually: e.g., missing `super.activate()`, or using raw DOM methods instead of `this.add_class()`.
   - Ensure that any new `Control` classes correctly accept and pass the `(spec = {})` object up the prototype chain to `super`.

## Anti-Patterns to Avoid

- **Blind Guessing (The Try-and-See Loop):** Writing code, running the app, crashing, guessing a fix, and restarting without ever running a check script to isolate the structural error first.
- **Tool-Context Mismatch:** Running linting tools with the wrong configuration scope. Always run linting localized to the specific sub-package or file.
- **Premature Success:** Telling the user "I have written the code" before running the static analysis commands to actually verify it compiles structurally.

## Validation

- Did you run the appropriate static analysis tool or check script?
- If the tool threw an error, did you feed that exact error back into your context to derive a structural fix?
- Is the code free of new structural errors?
