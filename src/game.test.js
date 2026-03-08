import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOLVER_ID,
  isSolvable,
  createGameState,
  createSolvedBoard,
  applyMove,
  findEmptyIndex,
  GAME_LIFECYCLE,
  GAME_EVENT_TYPES,
  MAX_GAME_EVENT_HISTORY,
  gameReducer,
  getMovableIndices,
  isSolved,
  moveTile,
  solveBoard,
  shuffleBoard,
  solveWithPlugin,
  updateHighscores,
} from "./game.js";
import {
  createSeededBoard,
  getBenchmarkBoards,
} from "./domain/fixtures/boardFixtures.js";

const size = 4;

describe("createSolvedBoard", () => {
  it("creates a solved 4x4 board with empty last", () => {
    const board = createSolvedBoard(size);
    expect(board).toHaveLength(16);
    expect(board[0]).toBe(1);
    expect(board[14]).toBe(15);
    expect(board[15]).toBe(0);
  });
});

describe("findEmptyIndex", () => {
  it("finds the empty slot", () => {
    const board = createSolvedBoard(size);
    expect(findEmptyIndex(board)).toBe(15);
  });
});

describe("getMovableIndices", () => {
  it("returns adjacent indices to the empty slot", () => {
    const board = createSolvedBoard(size);
    const movable = getMovableIndices(board, size).sort((a, b) => a - b);
    expect(movable).toEqual([11, 14]);
  });
});

describe("moveTile", () => {
  it("moves a tile into the empty slot when adjacent", () => {
    const board = createSolvedBoard(size);
    const { board: next, moved } = moveTile(board, 14, size);
    expect(moved).toBe(true);
    expect(next[14]).toBe(0);
    expect(next[15]).toBe(15);
    expect(board[15]).toBe(0);
  });

  it("rejects moves for non-adjacent tiles", () => {
    const board = createSolvedBoard(size);
    const { board: next, moved } = moveTile(board, 0, size);
    expect(moved).toBe(false);
    expect(next).toBe(board);
  });
});

describe("applyMove", () => {
  it("increments move count for valid moves", () => {
    const state = { board: createSolvedBoard(size), moves: 0 };
    const next = applyMove(state, 14, size);
    expect(next.moved).toBe(true);
    expect(next.moves).toBe(1);
  });

  it("does not increment move count for invalid moves", () => {
    const state = { board: createSolvedBoard(size), moves: 2 };
    const next = applyMove(state, 0, size);
    expect(next.moved).toBe(false);
    expect(next.moves).toBe(2);
  });
});

describe("shuffleBoard", () => {
  it("returns a new board after deterministic moves", () => {
    const board = createSolvedBoard(size);
    const rng = () => 0;
    const shuffled = shuffleBoard(board, 2, size, rng);
    expect(shuffled).toEqual([
      1, 2, 3, 4, 5, 6, 7, 0, 9, 10, 11, 8, 13, 14, 15, 12,
    ]);
    expect(board[15]).toBe(0);
  });

  it("returns the same board when move count is zero", () => {
    const board = createSolvedBoard(size);
    const shuffled = shuffleBoard(board, 0, size, () => 0.5);
    expect(shuffled).toBe(board);
  });
});

describe("isSolved", () => {
  it("returns true for solved boards", () => {
    const board = createSolvedBoard(size);
    expect(isSolved(board, size)).toBe(true);
  });

  it("returns false for unsolved boards", () => {
    const board = createSolvedBoard(size);
    const { board: next } = moveTile(board, 14, size);
    expect(isSolved(next, size)).toBe(false);
  });
});

describe("solveBoard", () => {
  it("returns solved status for solved boards", () => {
    const board = createSolvedBoard(size);
    const result = solveBoard(board, { size });
    expect(result.status).toBe("solved");
    expect(result.moves).toEqual([]);
  });

  it("finds a valid deterministic solution path", () => {
    const initial = createSolvedBoard(size);
    const one = moveTile(initial, 14, size).board;
    const board = moveTile(one, 10, size).board;

    const first = solveBoard(board, { size, maxNodes: 20000, maxTimeMs: 2000 });
    const second = solveBoard(board, { size, maxNodes: 20000, maxTimeMs: 2000 });

    expect(first.status).toBe("found");
    expect(first.moves).toEqual(second.moves);
    expect(first.moves.length).toBeGreaterThan(0);

    let current = board;
    for (const moveIndex of first.moves) {
      current = moveTile(current, moveIndex, size).board;
    }
    expect(isSolved(current, size)).toBe(true);
  });

  it("rejects unsolvable positions", () => {
    const unsolvable = [
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 15, 14, 0,
    ];
    expect(isSolvable(unsolvable, size)).toBe(false);

    const result = solveBoard(unsolvable, { size });
    expect(result.status).toBe("unsolvable");
    expect(result.moves).toBeNull();
  });

  it("returns bounded status when search limits are exceeded", () => {
    const board = createSeededBoard({ seed: 42, steps: 30, size });
    const result = solveBoard(board, {
      size,
      maxNodes: 1,
      maxTimeMs: 2000,
    });
    expect(result.status).toBe("bounded");
    expect(result.moves).toBeNull();
  });
});

describe("solver plugins", () => {
  it("solves through the default solver plugin contract", async () => {
    const board = getBenchmarkBoards().find((entry) => entry.id === "b001_near_solved_1").board;
    const result = await solveWithPlugin(
      {
        board,
        size,
        limits: { maxNodes: 100000, maxTimeMs: 1500 },
      },
      { solverId: DEFAULT_SOLVER_ID }
    );
    expect(result.status).toBe("found");
    expect(result.moves).toEqual([15]);
    expect(result.telemetry.algorithmId).toBe(DEFAULT_SOLVER_ID);
    expect(result.telemetry.deterministic).toBe(true);
  });
});

describe("gameReducer", () => {
  it("moves tiles and increments moves", () => {
    const state = createGameState(size);
    const next = gameReducer(state, { type: "MOVE_TILE", index: 14, size });
    expect(next.moves).toBe(1);
    expect(next.board[15]).toBe(15);
    expect(next.isShuffling).toBe(false);
  });

  it("sets and clears shuffling state", () => {
    const state = createGameState(size);
    const started = gameReducer(state, { type: "SHUFFLE_START" });
    expect(started.isShuffling).toBe(true);
    expect(started.lifecycle).toBe(GAME_LIFECYCLE.SHUFFLING);
    const ended = gameReducer(started, { type: "SHUFFLE_END" });
    expect(ended.isShuffling).toBe(false);
    expect(ended.lifecycle).toBe(GAME_LIFECYCLE.IDLE);
  });

  it("tracks explicit lifecycle transitions", () => {
    const initial = createGameState(size);
    expect(initial.lifecycle).toBe(GAME_LIFECYCLE.IDLE);

    const moved = gameReducer(initial, { type: "MOVE_TILE", index: 14, size });
    expect(moved.lifecycle).toBe(GAME_LIFECYCLE.PLAYING);

    const autosolving = gameReducer(moved, { type: "AUTOSOLVE_START" });
    expect(autosolving.lifecycle).toBe(GAME_LIFECYCLE.AUTOSOLVING);

    const solved = gameReducer(autosolving, { type: "BOARD_SOLVED" });
    expect(solved.lifecycle).toBe(GAME_LIFECYCLE.SOLVED);

    const naming = gameReducer(solved, { type: "NAME_CAPTURE_START" });
    expect(naming.lifecycle).toBe(GAME_LIFECYCLE.NAME_CAPTURE);

    const closed = gameReducer(naming, { type: "NAME_CAPTURE_END" });
    expect(closed.lifecycle).toBe(GAME_LIFECYCLE.IDLE);
  });

  it("emits move, solve, and score-save events", () => {
    const initial = createGameState(size);
    const moved = gameReducer(initial, {
      type: "MOVE_TILE",
      index: 14,
      size,
      source: "player",
    });
    expect(moved.events.at(-1).type).toBe(GAME_EVENT_TYPES.MOVE_APPLIED);

    const started = gameReducer(moved, {
      type: "AUTOSOLVE_START",
      solverId: "optimal-astar",
      limits: { maxNodes: 100000, maxTimeMs: 1500 },
    });
    expect(started.events.at(-1).type).toBe(GAME_EVENT_TYPES.SOLVE_STARTED);

    const solveStep = gameReducer(started, {
      type: "MOVE_TILE",
      index: 15,
      size,
      source: "solve",
      step: 1,
    });
    expect(solveStep.events.at(-1).type).toBe(GAME_EVENT_TYPES.SOLVE_STEP_APPLIED);

    const stopped = gameReducer(solveStep, {
      type: "AUTOSOLVE_STOP",
      solverId: "optimal-astar",
      status: "found",
      elapsedMs: 12,
    });
    expect(stopped.events.at(-1).type).toBe(GAME_EVENT_TYPES.SOLVE_COMPLETED);

    const naming = gameReducer(stopped, { type: "NAME_CAPTURE_START" });
    const scored = gameReducer(naming, {
      type: "SCORE_SAVED",
      name: "A",
      moves: 2,
      timeSeconds: 1,
    });
    expect(scored.events.at(-1).type).toBe(GAME_EVENT_TYPES.SCORE_SAVED);
  });

  it("caps event history and keeps the most recent events", () => {
    let state = createGameState(size);
    const totalMoves = MAX_GAME_EVENT_HISTORY + 75;

    for (let step = 0; step < totalMoves; step += 1) {
      state = gameReducer(state, {
        type: "MOVE_TILE",
        index: 14 + (step % 2),
        size,
        source: "player",
      });
    }

    expect(state.events).toHaveLength(MAX_GAME_EVENT_HISTORY);
    expect(state.events[0].type).toBe(GAME_EVENT_TYPES.MOVE_APPLIED);
    expect(state.events[0].tileIndex).toBe(14 + (75 % 2));
    expect(state.events.at(-1).type).toBe(GAME_EVENT_TYPES.MOVE_APPLIED);
    expect(state.events.at(-1).tileIndex).toBe(14 + ((totalMoves - 1) % 2));
  });

  it("ignores invalid lifecycle transitions and side effects", () => {
    const initial = createGameState(size);

    const stopWithoutStart = gameReducer(initial, {
      type: "AUTOSOLVE_STOP",
      status: "cancelled",
    });
    expect(stopWithoutStart).toBe(initial);

    const invalidNameStart = gameReducer(initial, { type: "NAME_CAPTURE_START" });
    expect(invalidNameStart).toBe(initial);

    const invalidNameEnd = gameReducer(initial, { type: "NAME_CAPTURE_END" });
    expect(invalidNameEnd).toBe(initial);

    const invalidScoreSave = gameReducer(initial, {
      type: "SCORE_SAVED",
      name: "A",
      moves: 1,
      timeSeconds: 1,
    });
    expect(invalidScoreSave).toBe(initial);

    const solvedMove = gameReducer(initial, { type: "MOVE_TILE", index: 14, size });
    const solved = gameReducer(solvedMove, { type: "BOARD_SOLVED" });
    const naming = gameReducer(solved, { type: "NAME_CAPTURE_START" });
    const blockedAutosolve = gameReducer(naming, { type: "AUTOSOLVE_START" });
    expect(blockedAutosolve).toBe(naming);

    const blockedShuffle = gameReducer(naming, { type: "SHUFFLE_START" });
    expect(blockedShuffle).toBe(naming);

    const shuffleStepOutsideShuffle = gameReducer(initial, {
      type: "SHUFFLE_STEP",
      size,
      step: 1,
      rng: () => 0,
    });
    expect(shuffleStepOutsideShuffle).toBe(initial);

    const shuffleEndOutsideShuffle = gameReducer(initial, { type: "SHUFFLE_END" });
    expect(shuffleEndOutsideShuffle).toBe(initial);
  });
});

describe("highscores", () => {
  it("updates high scores in ascending order", () => {
    const updated = updateHighscores(
      [
        { name: "A", moves: 50, timeSeconds: 90 },
        { name: "B", moves: 40, timeSeconds: 70 },
      ],
      45,
      80,
      "C",
      5
    );
    expect(updated).toEqual([
      { name: "B", moves: 40, timeSeconds: 70, solvedAt: null },
      { name: "C", moves: 45, timeSeconds: 80, solvedAt: null },
      { name: "A", moves: 50, timeSeconds: 90, solvedAt: null },
    ]);
  });

  it("limits high scores to the configured size", () => {
    const updated = updateHighscores(
      [
        { name: "A", moves: 10 },
        { name: "B", moves: 11 },
        { name: "C", moves: 12 },
        { name: "D", moves: 13 },
        { name: "E", moves: 14 },
      ],
      9,
      20,
      "F",
      5
    );
    expect(updated).toEqual([
      { name: "F", moves: 9, timeSeconds: 20, solvedAt: null },
      { name: "A", moves: 10, timeSeconds: null, solvedAt: null },
      { name: "B", moves: 11, timeSeconds: null, solvedAt: null },
      { name: "C", moves: 12, timeSeconds: null, solvedAt: null },
      { name: "D", moves: 13, timeSeconds: null, solvedAt: null },
    ]);
  });

  it("stores solved timestamp metadata", () => {
    const updated = updateHighscores([], 12, 40, "A", 5, "2026-03-08T20:00:00.000Z");
    expect(updated[0]).toEqual({
      name: "A",
      moves: 12,
      timeSeconds: 40,
      solvedAt: "2026-03-08T20:00:00.000Z",
    });
  });
});
