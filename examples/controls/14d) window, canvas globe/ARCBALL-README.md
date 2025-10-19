# Arcball Drag Behavior - Modularized Implementation

## Overview

This directory contains a **working, tested implementation** of arcball drag behavior that has been modularized into reusable components. The implementation is isolated from UI concerns and thoroughly tested with pure mathematical tests.

## Architecture

### Core Components

1. **`drag-behaviour-base.js`** - Base class for drag behaviors
   - Handles common drag state (dragging flag, timing)
   - Provides lifecycle hooks: `on_drag_start()`, `on_drag_move()`, `on_drag_end()`
   - Foundation for any drag behavior, not specific to arcball

2. **`arcball-drag-behaviour.js`** - Arcball-specific drag behavior
   - Extends `DragBehaviourBase`
   - Implements the sophisticated arcball math:
     - `screen_to_arcball()` - Projects 2D screen coords to 3D sphere
     - Quaternion-based rotation composition
     - Angular velocity calculation
     - Exponential inertia decay
   - **This contains the core math that makes arcball rotation work correctly**

3. **`drag-controller.js`** - UI event wiring
   - Handles DOM pointer events (down, move, up, cancel)
   - Manages pointer capture
   - Transforms screen coordinates to normalized space
   - Delegates to behavior instance
   - Completely separate from the math

4. **`math.js`** - Quaternion and matrix utilities
   - Pure math functions for 3D rotations
   - Used by arcball behavior
   - Independently tested

### Integration

**`EarthGlobeRenderer.js`** uses these components:
```javascript
this.drag_behaviour = new ArcballDragBehaviour({...});
this.drag_controller = new DragController(canvas, this.drag_behaviour, {...});
```

## Tests

### Pure Mathematical Tests (No Browser APIs)

**`math.test.js`** (21 tests) - Tests quaternion & matrix math:
- Quaternion operations (identity, normalize, multiply, from axis-angle, from vectors)
- Matrix operations (from quaternion, transpose)
- Integration tests (vector rotation, composition)

**`arcball-drag-behaviour.test.js`** (15 tests) - Tests arcball behavior:
- Screen-to-arcball projection
- Drag rotation mathematics
- Vector length preservation
- Quaternion normalization
- Matrix orthogonality
- Edge cases (zero drag, tiny movements, large movements)
- Angular velocity and inertia decay

### Running Tests

```bash
cd "examples/controls/14d) window, canvas globe"
npx mocha "*.test.js"
```

All 36 tests pass ✓

## Key Arcball Math

### 1. Screen to Arcball Projection

Maps 2D normalized coordinates `(x, y)` to a point on a unit sphere:

- **Inside unit circle**: `z = sqrt(1 - x² - y²)` (sphere equation)
- **Outside unit circle**: Project onto edge with `z = 0`
- Result is always a unit vector on the sphere surface

### 2. Rotation Composition

When dragging from point `v0` to `v1` on the arcball:

1. Compute quaternion `dq` that rotates `v0` to `v1`
2. Compose with existing rotation: `q = dq * q`
3. Normalize to maintain unit quaternion
4. Update rotation matrices from quaternion

### 3. Inertia

- Calculate angular velocity `ω` from drag movement
- Extract rotation axis from quaternion
- Apply exponential decay: `ω(t) = ω₀ * e^(-friction * t)`

## Integration into Other Projects

To use this arcball implementation in another project:

### Option 1: Copy the Behavior Classes

Copy these files:
- `drag-behaviour-base.js`
- `arcball-drag-behaviour.js`
- `math.js`

Then wire up UI events yourself, or adapt `drag-controller.js`.

### Option 2: Use as Reference

The **tests** (`*.test.js`) define the expected behavior mathematically. You can:
1. Copy the test files
2. Run them against your own implementation
3. Fix any failures to match the correct behavior

### Validation

The tests verify:
- ✓ Proper sphere projection for all input coordinates
- ✓ Unit quaternions maintained through all operations
- ✓ Orthogonal rotation matrices
- ✓ Vector lengths preserved after rotation
- ✓ Correct rotation axes for horizontal/vertical drags
- ✓ Stability with edge cases (zero movement, tiny movements, huge movements)
- ✓ No NaN values under any conditions

## Notes

- All tests are **pure math** - no `requestAnimationFrame`, no DOM, no browser APIs
- Tests can run in Node.js
- The math is isolated and portable
- Following `snake_case` convention per AGENTS.md guidelines

## Success Criteria

A correct arcball implementation should:
1. Pass all 36 tests
2. Feel smooth and intuitive when dragging
3. Never produce NaN or invalid rotations
4. Handle edge cases gracefully
5. Maintain mathematical invariants (unit quaternions, orthogonal matrices)

---

**This implementation works correctly.** The tests validate the math. Use these tests to verify implementations in other projects.
