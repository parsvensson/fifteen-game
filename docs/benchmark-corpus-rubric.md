# Benchmark Board Corpus and Scoring Rubric

Status: Draft v1 (2026-03-08)
Corpus file: `docs/benchmarks/board-corpus.v1.json`

## Corpus Definition

- Fixed set of 12 solvable 4x4 boards.
- Difficulty bands:
  - Easy: `b001`-`b005`
  - Medium: `b006`-`b008`
  - Hard: `b009`-`b012`
- Boards are immutable within `v1`; any changes require `v2`.

## Benchmark Run Rules

- Run each solver against all 12 boards.
- Use identical limits for all solvers in a run:
  - `maxTimeMs = 1500`
  - `maxNodes = 100000`
- For non-deterministic solvers, run 5 seeded attempts per board and aggregate.
- Execute in isolated process/worker where possible to reduce UI thread noise.

## Metrics

Primary metrics:

- Completion rate: solved boards / total boards.
- Mean move count for solved boards.
- P95 runtime (`elapsedMs`) for solved boards.

Secondary metrics:

- Mean explored nodes.
- Bounded rate.
- Error rate.

## Scoring Rubric

Overall weighted score (0-100):

- Completion rate: 50%
- Move efficiency: 25%
- Runtime: 20%
- Stability (bounded/error penalties): 5%

Component scoring:

- Completion score = `100 * completionRate`.
- Move score compares against baseline (`optimal-astar`) on solved overlap:
  - `100` if equal mean moves to baseline.
  - Linear down to `0` at +100% move inflation.
- Runtime score:
  - `100` at or below 50ms mean runtime.
  - Linear down to `0` at 1500ms mean runtime.
- Stability penalty:
  - `-5` if bounded rate > 20%.
  - `-5` if error rate > 0%.

## Acceptance Targets by Solver Category

- Optimal solver (`optimal-astar`):
  - Completion rate >= 95%
  - Move inflation = 0% on known-optimal boards
- Heuristic solvers (`greedy-manhattan`, `misplaced-tiles`):
  - Completion rate >= 80%
  - Mean move inflation <= 60% vs optimal on solved overlap
- Rule-of-thumb solver (`row-by-row`):
  - Completion rate >= 70%
  - Mean move inflation <= 90% vs optimal on solved overlap

## Reporting Template

Each run report must include:

- Timestamp and commit SHA.
- Solver plugin metadata (`id`, `version`, `deterministic`).
- Limits used (`maxTimeMs`, `maxNodes`, seed strategy).
- Aggregate metrics and per-board outcomes.
- Final weighted score and rank order.
