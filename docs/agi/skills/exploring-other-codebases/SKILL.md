---
name: exploring-other-codebases
description: Standard Operating Procedure for exploring unfamiliar, external, or third-party codebases. Use this skill when asked to review, audit, or integrate with a repository outside of your immediate context or training.
---

# Exploring Other Codebases

## Scope

This Skill provides a structured, high-speed methodology for exploring and mapping a completely unfamiliar external codebase without becoming overwhelmed by massive file counts or undocumented structures.

## Triggers

- "Explore this new repository"
- "How does [External Library] work internally?"
- "Let's look at the source code for [Dependency]"
- Integrating a completely new third-party sub-module

## Core Architecture Mapping

When dealing with a new codebase, you cannot rely on knowing the directory conventions beforehand. You must discover them systematically.

## Methodology

### 1. Identify the Foundation (Entry Points)
Before reading *any* logic code, you must locate and read the foundational setup files.
- **Package Managers/Dependencies:** Search for `package.json`, `pom.xml`, `requirements.txt`, `Cargo.toml`, or `go.mod`. Use `view_file` on these to understand instantly what libraries the project relies on and what scripts it exposes (e.g., `npm run build`).
- **Entry Points:** Look for `index.js`, `main.go`, `app.py`, or similar root-level execution files. 

### 2. Map the High-Level Structure
Do not manually walk every directory.
- Use `list_dir` on the project root *once* to get the top-level folders.
- Identify the most likely source code folder (typically `src/`, `lib/`, `app/`, or named after the project).

### 3. Structural File Reading (Progressive Disclosure)
When opening files in an unknown codebase, they may be overwhelmingly large or complex.
- **MANDATORY**: Use `view_file_outline` to read the signature/structure of *any* file before using `view_file` to read its full contents. This allows you to map classes and exported functions instantly without flooding your context window with thousands of lines of implementation details.
- If a file is over 1000 lines, use `grep_search` targeted *within* that file to find the specific function you need, rather than reading the whole file.

### 4. Follow the Data (Trace Execution)
If you need to understand a specific feature:
1. Find the entry point or API route (e.g., `grep_search` for the route name).
2. Trace the function calls. 
3. Use `grep_search` to find where imported modules are defined if their location isn't obvious.

## Anti-Patterns to Avoid

- **The Breadth-First Blind Spot**: Using `list_dir` on every single sub-directory (like `node_modules` or `vendor`) before looking at `package.json` or `README.md`.
- **Context Flooding**: Using `view_file` on 5 different core files simultaneously in an unknown codebase, completely destroying your context window limits, instead of using `view_file_outline`.
- **Assuming Conventions**: Assuming an external Node.js app uses Express just because another project does. Always check the dependency file first.

## Validation

- Did you check `package.json` (or equivalent) before exploring the source directories?
- Did you use `view_file_outline` to map large files instead of reading them blindly?
- Can you summarize the high-level architecture (entry point, key directories, main framework) to the user?
