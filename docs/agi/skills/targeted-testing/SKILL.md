---
name: targeted-testing
description: Pick and run the smallest correct validation step (smoke tests → check scripts → focused test suites → broader suites). Use whenever you modify code and need confidence quickly.
---

# Targeted Testing

## Scope

- Select the smallest test/check that proves the change
- Prevent slow, flaky, or irrelevant test runs
- Capture evidence in working notes

## Inputs

- Files changed
- Whether the change is server / control / publisher / middleware / CLI
- Existing test files near the code

## Procedure

0. **Require smoke test** — the cheapest possible validation. Before running any test suite, verify the module loads without errors:
   ```bash
   node -e "require('./path/to/module'); console.log('OK')"
   ```
   This catches missing imports, syntax errors, and circular dependencies in <1 second. Especially valuable after decomposing a monolith into smaller modules — smoke-test each extracted module individually.

1. Prefer a local check script first (fast, deterministic, exits cleanly).
   - Look for existing tests in `tests/` near the changed code.

2. Then run the smallest test suite by path:
   ```bash
   npx mocha tests/path/to/specific.test.js
   ```
   Or if using vitest:
   ```bash
   npx vitest run tests/path/to/specific.test.js
   ```

3. Only then widen to broader suites if needed:
   ```bash
   npm test
   ```

4. Record the exact commands and outcomes in working notes.

## Validation

- Use the test runner configured in `package.json` scripts.
- Verify all new/changed functionality has at least one covering test.

## Escalation / Research request

Ask for dedicated research if:

- there is no obvious "smallest check" and you need a new check harness
- the feature spans multiple systems and you need a validation ladder proposal

## References

- Test directory: `tests/`
- Package scripts: `package.json`
- Repo guidelines: `AGENTS.md`
