---
name: runaway-process-guard
description: Prevents infinite loops and runaway execution by enforcing strict timeouts, circuit breakers, and semantic repetition detection.
---

# Runaway Process Guard

This skill codifies explicit rules for preventing an AI agent from getting stuck in infinite loops, runaway scripts, or deadlocked background processes. Because agents inherently optimize for continuation and lack an intuitive "sense of time," these external operational rules must be strictly adhered to whenever interacting with the terminal or writing polling loops.

## Scope
- Applies to all custom scripts written by the agent that involve loops (`while`, `for`, `setInterval`).
- Applies to all agent interactions with background commands (using `run_command` and `command_status`).
- Does **not** supersede domain-specific graceful degradation if a tool provides a native way to timeout gracefully, but acts as the hard ceiling above it.

## The 3 Pillars of Runaway Prevention

### 1. Hard Timeboxing (Programmatic Circuit Breakers)
Never write a custom polling script or infinite loop without a programmatic wall-clock timeout.
*   **Rule:** Every `while(running)` or indefinite status check loop MUST track `Date.now()`.
*   **Implementation:** 
    ```javascript
    const MAX_WAIT_MS = 60000; // 1 minute
    const start = Date.now();
    while (running && (Date.now() - start < MAX_WAIT_MS)) {
        // ... poll ...
    }
    if (running) {
        console.error("TIMEOUT_CIRCUIT_BREAKER_TRIPPED");
        process.exit(1);
    }
    ```
*   **Rule:** When using `execSync` from Node, ALWAYS pass the `{ timeout: X }` flag.

### 2. Semantic Repetition Detection (Agent Circuit Breaker)
When polling a background process using the `command_status` tool, you must act as the circuit breaker.
*   **Rule:** If you check the status of a command 3 times and the text output reveals identical states (e.g., repeatedly showing the same output over 60 seconds), you MUST assume the process is deadlocked or state tracking has failed.
*   **Action:** Immediately cease waiting. Do not passive-poll in hopes that it will magically resolve.

### 3. Immediate Termination Protocols
If a process is determined to be stuck (either by tripping the semantic repetition detector or visually hanging during a user interaction):
*   **Action:** Use the `send_command_input` tool with `Terminate: true` to kill the background job.
*   **Action:** If a script spawned detached daemon processes, terminating the parent CLI command will not kill the workers. You MUST issue explicit kill/stop commands to eradicate the orphaned runaways.

## Escalation / Pivot
When a circuit breaker is tripped:
1. Do not immediately rewrite the script and try the exact same approach again. 
2. Record the timeout failure in an artifact or thought process.
3. Investigate if the underlying system provides an alternate, safer primitive.
4. Prompt the user for guidance if the underlying mechanism seems fundamentally broken.
