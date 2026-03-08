import benchmarkCorpus from "../../../docs/benchmarks/board-corpus.v1.json" with { type: "json" };
import { BOARD_SIZE } from "../../config.js";
import { createSolvedBoard, shuffleBoard } from "../board.js";

export const ROBOT_SOLVE_SEQUENCE = [15, 15];

export function createSeededRng(seed) {
  let state = seed >>> 0;
  return function seededRng() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export function createSeededBoard({
  seed,
  steps,
  size = BOARD_SIZE,
}) {
  const rng = createSeededRng(seed);
  return shuffleBoard(createSolvedBoard(size), steps, size, rng);
}

export function getBenchmarkBoards() {
  return benchmarkCorpus.boards.map((entry) => ({
    id: entry.id,
    board: [...entry.board],
    difficulty: entry.difficulty,
    expectedOptimalMoves: entry.expectedOptimalMoves ?? null,
  }));
}
