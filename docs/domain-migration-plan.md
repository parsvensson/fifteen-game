# Phased Migration Plan: React-Coupled App to Domain/UI Split

Status: Draft v1 (2026-03-08)
Primary issue: `fifteen-0of`

## Objective

Move from current `App.jsx` orchestration to a domain-first architecture with a thin React adapter, while preserving existing behavior at each phase.

## Constraints

- No feature freeze required.
- Preserve current gameplay behavior (shuffle, solve, highscores, celebration).
- Keep test suite green at every checkpoint.

## Phase Plan

## Phase 0: Baseline and Safety Net

Deliverables:

- Snapshot current behavior with targeted unit tests around `game.js` and integration tests around key App flows.
- Add issue-linked architecture docs (completed in this planning tranche).

Rollback point:

- Revert only new docs/tests; runtime behavior untouched.

Cutover checkpoint:

- Green CI baseline before runtime refactors start.

## Phase 1: Extract Pure Domain APIs

Deliverables:

- Create `src/domain/board/*` for board operations currently in `src/game.js`.
- Create `src/domain/solver/*` and move current `solveBoard` into `optimal-astar` plugin wrapper.
- Keep `src/game.js` as compatibility facade exporting existing function names.

Compatibility adapter strategy:

- `src/game.js` forwards to domain modules with identical signatures.
- Existing imports in `App.jsx` remain unchanged.

Rollback point:

- Keep old function implementations behind a feature branch until facade passes tests.

Cutover checkpoint:

- `src/game.js` becomes only adapter layer; all logic exercised from `src/domain/*`.

## Phase 2: Introduce Game State Machine + Event Pipeline

Deliverables:

- Implement `src/domain/game/gameMachine.js` with explicit states/transitions.
- Implement typed event emission in `src/domain/game/gameEvents.js`.
- Replace booleans in orchestration with state machine events while preserving UI behavior.

Compatibility adapter strategy:

- Add `src/ui/adapters/reactGameAdapter.js` that maps UI callbacks to machine events and exposes UI-friendly selectors.

Rollback point:

- Retain existing boolean-based flow behind a temporary adapter switch flag.

Cutover checkpoint:

- App no longer owns transition logic directly; transitions occur through machine actions.

## Phase 3: Workerize Solver Execution

Deliverables:

- Add worker protocol and worker host (`src/domain/solver/worker/*`).
- Route autosolve through worker transport with cancel and timeout handling.
- Maintain same statuses (`idle/running/done/error`) initially for UI continuity.

Compatibility adapter strategy:

- Fallback path uses same-thread solver if worker unavailable.

Rollback point:

- Runtime feature flag to force same-thread execution.

Cutover checkpoint:

- Default path uses worker; fallback path verified in tests.

## Phase 4: Multi-solver Selection and Benchmarks

Deliverables:

- Add plugin registry and solver selector.
- Integrate benchmark corpus and run harness.
- Add telemetry summaries in tests/reports.

Compatibility adapter strategy:

- Default selected solver remains equivalent to current solver behavior.

Rollback point:

- Keep default solver pinned; hide new solver options behind flag if needed.

Cutover checkpoint:

- Multiple solvers available with stable contract and acceptance test coverage.

## Risk Register

- Risk: state machine introduces flow regressions.
  - Mitigation: transition table tests + BDD regression scenarios.
- Risk: worker protocol desync.
  - Mitigation: strict message schema validation and requestId correlation tests.
- Risk: performance regressions from abstraction overhead.
  - Mitigation: benchmark corpus and budget gates before enabling by default.

## Exit Criteria

Migration is complete when:

- React components do not import board/solver internals directly.
- Domain machine/events drive gameplay transitions.
- At least two solvers run via plugin contract.
- Benchmark and acceptance criteria docs are enforced by automated tests.
