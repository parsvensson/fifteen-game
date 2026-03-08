# Solver Plugin Runway Architecture

Status: Draft v1 (2026-03-08)
Scope: Architectural runway for `fifteen-bun` and its blocking tasks.

## Goals

- Add multiple robot solver algorithms without coupling solver internals to React components.
- Make game flow explicit through a lifecycle state machine.
- Introduce a typed event pipeline that supports telemetry and replay.
- Allow CPU-heavy algorithms to run in a Web Worker with a stable protocol.

## Non-goals

- Implementing additional solver algorithms in this document.
- Final UI design for solver picker/benchmark views.

## Current Baseline (Observed)

- `src/App.jsx` currently orchestrates gameplay flow, shuffle flow, autosolve flow, and UI state.
- `src/game.js` contains board domain logic plus one built-in A*-style solver (`solveBoard`).
- Game transitions are distributed across booleans (`isShuffling`, `autosolveStatus`, modal visibility).

## Target Module Layout

```
src/domain/
  board/
    boardState.js
    boardRules.js
  game/
    gameMachine.js
    gameEvents.js
  solver/
    solverTypes.js
    solverRegistry.js
    builtins/
      optimalAStar.js
      greedyManhattan.js
      misplacedTiles.js
      rowByRow.js
    worker/
      solver.worker.js
      solverWorkerProtocol.js
src/ui/
  adapters/
    reactGameAdapter.js
```

## Solver Plugin Contract

All solver implementations must export this shape:

```ts
export type SolverPlugin = {
  id: string;                    // stable key, e.g. "optimal-astar"
  label: string;                 // user-facing name
  version: string;               // semver for telemetry and reproducibility
  deterministic: boolean;        // true if same input+options => same output
  supportsHints: boolean;
  maxRecommendedNodes?: number;
  maxRecommendedTimeMs?: number;
  solve(input: SolverInput): Promise<SolverResult> | SolverResult;
  nextHint?(input: SolverInput): Promise<HintResult> | HintResult;
};

export type SolverInput = {
  board: number[];
  size: number;
  seed?: number;
  limits: {
    maxNodes: number;
    maxTimeMs: number;
    maxMoves?: number;
  };
};

export type SolverResult = {
  status: "found" | "solved" | "bounded" | "unsolvable" | "invalid" | "error";
  moves: number[] | null;
  exploredNodes: number;
  elapsedMs: number;
  reason?: string;
  telemetry: {
    algorithmId: string;
    algorithmVersion: string;
    deterministic: boolean;
    seedUsed: number | null;
  };
};
```

Contract rules:

- `id` and `version` are immutable once released.
- `moves` is `null` unless `status` is `found` or `solved`.
- `solve()` must never throw uncaught errors; failures return `status: "error"` with `reason`.
- Plugins must not mutate input board.

## Lifecycle State Machine

Canonical game states:

- `idle`: initial/reset solved board, no active round.
- `shuffling`: shuffle in progress, player input locked.
- `playing`: user can move tiles.
- `autosolving`: solver-generated moves are being applied.
- `solved`: board solved, awaiting score capture or next action.
- `name_capture`: modal open for score name input.

Allowed transitions:

- `idle -> shuffling` (`SHUFFLE_REQUESTED`)
- `shuffling -> playing` (`SHUFFLE_COMPLETED`)
- `playing -> autosolving` (`AUTOSOLVE_REQUESTED`)
- `autosolving -> solved` (`AUTOSOLVE_COMPLETED`)
- `playing -> solved` (`BOARD_SOLVED`)
- `solved -> name_capture` (`SCORE_CAPTURE_REQUESTED`)
- `name_capture -> idle` (`SCORE_CAPTURED` or `SCORE_CAPTURE_SKIPPED`)
- `autosolving -> playing` (`AUTOSOLVE_CANCELLED`)
- `playing -> shuffling` (`SHUFFLE_REQUESTED`)

Guard examples:

- Tile moves are valid only in `playing`.
- Shuffle/autosolve requests are rejected in `name_capture`.
- Entering `shuffling` always resets move/time counters.

## Event Pipeline Contract

Events are append-only facts emitted by domain actions.

```ts
type GameEvent =
  | { type: "MOVE_APPLIED"; at: string; tile: number; from: number; to: number }
  | { type: "SHUFFLE_STARTED"; at: string; steps: number; seed: number | null }
  | { type: "SHUFFLE_STEP_APPLIED"; at: string; step: number; tileIndex: number }
  | { type: "SHUFFLE_COMPLETED"; at: string }
  | { type: "SOLVE_STARTED"; at: string; solverId: string; limits: { maxNodes: number; maxTimeMs: number } }
  | { type: "SOLVE_STEP_APPLIED"; at: string; moveIndex: number; step: number }
  | { type: "SOLVE_COMPLETED"; at: string; solverId: string; status: SolverResult["status"]; elapsedMs: number }
  | { type: "SCORE_SAVED"; at: string; name: string; moves: number; timeSeconds: number };
```

Pipeline requirements:

- Event payloads are serializable JSON.
- `at` uses ISO-8601 UTC timestamps.
- Event order is stable and deterministic for deterministic solver runs.
- Consumers (UI, telemetry, replay) are read-only; they never mutate domain state.

## Web Worker Message Protocol

Channel: `postMessage` between main thread and `solver.worker.js`.

Request messages:

```ts
{ type: "SOLVER_RUN_REQUEST"; requestId: string; solverId: string; input: SolverInput }
{ type: "SOLVER_HINT_REQUEST"; requestId: string; solverId: string; input: SolverInput }
{ type: "SOLVER_CANCEL_REQUEST"; requestId: string }
```

Response messages:

```ts
{ type: "SOLVER_PROGRESS"; requestId: string; exploredNodes: number; elapsedMs: number }
{ type: "SOLVER_RUN_RESPONSE"; requestId: string; result: SolverResult }
{ type: "SOLVER_HINT_RESPONSE"; requestId: string; result: HintResult }
{ type: "SOLVER_ERROR"; requestId: string; errorCode: "UNKNOWN_SOLVER" | "INVALID_INPUT" | "INTERNAL_ERROR"; message: string }
{ type: "SOLVER_CANCELLED"; requestId: string }
```

Protocol requirements:

- Every response must echo `requestId`.
- Unknown `solverId` returns `SOLVER_ERROR` (no throw across boundary).
- Worker must support cooperative cancel checks for long searches.
- Main thread keeps timeout budget and may issue cancel on overrun.

## Compatibility and Rollout Notes

- Existing `solveBoard()` in `src/game.js` will be wrapped as the first plugin (`optimal-astar`) before extraction.
- React layer keeps current behavior by using a temporary adapter (`reactGameAdapter`) that maps old callbacks to new actions/events.
- State machine and event pipeline should land before adding additional algorithms.

## Open Decisions

- Whether benchmark runs should execute only in worker mode or allow same-thread fallback.
- Whether `SOLVER_PROGRESS` should be fixed-frequency or threshold-based (e.g., every 500 nodes).
- Storage strategy for event history (memory only vs persisted sampled runs).
