# Solver Acceptance Criteria

Status: Draft v1 (2026-03-08)
Scope: Definition-of-done for solver algorithm implementations that plug into the runway contract.

## Global Criteria (Applies to Every Solver)

1. Contract compliance
- Implements plugin interface defined in `docs/solver-plugin-architecture.md`.
- Returns only allowed statuses and typed telemetry payload.
- Does not mutate `input.board`.

2. Determinism expectations
- If plugin metadata says `deterministic: true`, two runs with identical `board`, `limits`, and `seed` must return identical `status` and `moves`.
- If `deterministic: false`, plugin must still record `seedUsed` in telemetry for reproducibility.

3. Runtime ceilings
- Honors `limits.maxTimeMs`; must terminate within `maxTimeMs + 100ms` overhead.
- Honors `limits.maxNodes` if the algorithm is graph-search based.
- On limit exceed, returns `status: "bounded"` with `moves: null`.

4. Failure behavior
- Invalid input returns `status: "invalid"`.
- Known unsolvable board returns `status: "unsolvable"`.
- Internal failure returns `status: "error"` with `reason`; no uncaught throw.

5. Output shape
- `moves` is an array of tile indices for `found`/`solved`; otherwise `null`.
- `elapsedMs >= 0`, `exploredNodes >= 0`.
- Applying returned move sequence from the original board must not produce illegal moves.

6. Telemetry required fields
- `algorithmId`, `algorithmVersion`, `deterministic`, `seedUsed`.
- Caller-visible summary fields: `status`, `elapsedMs`, `exploredNodes`, `moveCount`.

## Algorithm-Specific Criteria

## `optimal-astar`

- `deterministic` must be `true`.
- Tie-breakers must be stable (same board => same path).
- For corpus boards where an optimal path length is known, returned move count must equal expected optimal length.
- Must return `bounded` (not `error`) when limits are too tight.

## `greedy-manhattan`

- `deterministic` can be `true` if tie-breakers are fixed; otherwise set `false` and require seed.
- Should prioritize shortest Manhattan estimate each step.
- Must include dead-end avoidance (no immediate two-state oscillation unless unavoidable).
- If no progress possible under configured cap, return `bounded`.

## `misplaced-tiles`

- Uses misplaced-tile heuristic as primary ranking signal.
- Tie-breaking rules must be documented and stable.
- Must terminate under limits even on difficult boards.

## `row-by-row`

- Prioritizes completion reliability over move optimality.
- Must report phase progress in debug telemetry (`phase`: row/column/final-2x2).
- If strategy gets stuck, return `bounded` or `error` with explicit reason; never loop forever.

## Required Test Matrix

Every solver must include at least:

- Solved board test: returns `solved` with empty move list.
- Invalid board test: returns `invalid`.
- Unsolvable board test: returns `unsolvable`.
- Determinism test (or seed reproducibility test if non-deterministic).
- Bounded-time test (`maxTimeMs` tiny).
- Bounded-node test (`maxNodes` tiny) where relevant.
- Integration test: returned moves can be replayed with domain move rules.

## Minimum Quality Gates

- Unit tests green (`npm test -- --run`).
- BDD scenarios for solver-selection flow green (`npm run test:bdd`).
- New solver includes README/docs entry with intended behavior and limitations.
