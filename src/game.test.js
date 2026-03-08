import { describe, expect, it } from "vitest";
import {
  createGameState,
  createSolvedBoard,
  applyMove,
  findEmptyIndex,
  gameReducer,
  getMovableIndices,
  isSolved,
  moveTile,
  loadHighscores,
  saveHighscores,
  shuffleBoard,
  updateHighscores,
} from "./game.js";

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
    const ended = gameReducer(started, { type: "SHUFFLE_END" });
    expect(ended.isShuffling).toBe(false);
  });
});

describe("highscores", () => {
  it("updates high scores in ascending order", () => {
    const updated = updateHighscores(
      [{ name: "A", moves: 50 }, { name: "B", moves: 40 }],
      45,
      "C",
      5
    );
    expect(updated).toEqual([
      { name: "B", moves: 40 },
      { name: "C", moves: 45 },
      { name: "A", moves: 50 },
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
      "F",
      5
    );
    expect(updated).toEqual([
      { name: "F", moves: 9 },
      { name: "A", moves: 10 },
      { name: "B", moves: 11 },
      { name: "C", moves: 12 },
      { name: "D", moves: 13 },
    ]);
  });

  it("loads and saves named scores using storage", () => {
    const storage = (() => {
      let data = {};
      return {
        getItem: (key) => data[key] ?? null,
        setItem: (key, value) => {
          data[key] = value;
        },
      };
    })();

    saveHighscores(
      [
        { name: "Lin", moves: 3 },
        { name: "Max", moves: 7 },
      ],
      storage
    );
    expect(loadHighscores(storage)).toEqual([
      { name: "Lin", moves: 3 },
      { name: "Max", moves: 7 },
    ]);
  });

  it("normalizes legacy numeric scores from storage", () => {
    const storage = {
      getItem: () => JSON.stringify([4, 6]),
      setItem: () => {},
    };

    expect(loadHighscores(storage)).toEqual([
      { name: "Anonymous", moves: 4 },
      { name: "Anonymous", moves: 6 },
    ]);
  });
});
