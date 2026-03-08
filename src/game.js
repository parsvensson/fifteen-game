import { BOARD_SIZE, HIGHSCORE_LIMIT } from "./config.js";

export function createSolvedBoard(size = BOARD_SIZE) {
  const total = size * size;
  const board = Array.from({ length: total }, (_, index) => index + 1);
  board[total - 1] = 0;
  return board;
}

export function createGameState(size = BOARD_SIZE) {
  return {
    board: createSolvedBoard(size),
    moves: 0,
    isShuffling: false,
  };
}

export function findEmptyIndex(board) {
  return board.indexOf(0);
}

export function getMovableIndices(board, size = BOARD_SIZE) {
  const emptyIndex = findEmptyIndex(board);
  const row = Math.floor(emptyIndex / size);
  const col = emptyIndex % size;
  const indices = [];

  if (row > 0) {
    indices.push(emptyIndex - size);
  }
  if (row < size - 1) {
    indices.push(emptyIndex + size);
  }
  if (col > 0) {
    indices.push(emptyIndex - 1);
  }
  if (col < size - 1) {
    indices.push(emptyIndex + 1);
  }

  return indices;
}

export function moveTile(board, tileIndex, size = BOARD_SIZE) {
  const movable = getMovableIndices(board, size);
  if (!movable.includes(tileIndex)) {
    return { board, moved: false };
  }

  const emptyIndex = findEmptyIndex(board);
  const nextBoard = board.slice();
  nextBoard[emptyIndex] = board[tileIndex];
  nextBoard[tileIndex] = 0;
  return { board: nextBoard, moved: true };
}

export function applyMove(state, tileIndex, size = BOARD_SIZE) {
  const result = moveTile(state.board, tileIndex, size);
  if (!result.moved) {
    return { ...state, moved: false };
  }

  return {
    board: result.board,
    moves: state.moves + 1,
    moved: true,
  };
}

export function isSolved(board, size = BOARD_SIZE) {
  const solved = createSolvedBoard(size);
  return board.every((value, index) => value === solved[index]);
}

export function shuffleBoard(
  board,
  moves = 50,
  size = BOARD_SIZE,
  rng = Math.random
) {
  if (moves <= 0) {
    return board;
  }

  let nextBoard = board;
  for (let step = 0; step < moves; step += 1) {
    const movable = getMovableIndices(nextBoard, size);
    const choice = movable[Math.floor(rng() * movable.length)];
    nextBoard = moveTile(nextBoard, choice, size).board;
  }

  return nextBoard;
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "MOVE_TILE": {
      if (state.isShuffling) {
        return state;
      }

      const next = applyMove(state, action.index, action.size ?? BOARD_SIZE);
      if (!next.moved) {
        return state;
      }

      return {
        ...state,
        board: next.board,
        moves: next.moves,
      };
    }

    case "SHUFFLE_START":
      return {
        ...state,
        isShuffling: true,
        moves: 0,
      };

    case "SHUFFLE_STEP":
      return {
        ...state,
        board: shuffleBoard(state.board, 1, action.size ?? BOARD_SIZE, action.rng),
        moves: 0,
      };

    case "SHUFFLE_END":
      return {
        ...state,
        isShuffling: false,
      };

    default:
      return state;
  }
}

function normalizePlayerName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed || "Anonymous";
}

function normalizeScoreEntry(entry) {
  if (typeof entry === "number" && Number.isFinite(entry)) {
    return { name: "Anonymous", moves: entry, timeSeconds: null };
  }

  if (
    entry &&
    typeof entry === "object" &&
    Number.isFinite(entry.moves)
  ) {
    const timeSeconds = Number.isFinite(entry.timeSeconds) ? entry.timeSeconds : null;
    return { name: normalizePlayerName(entry.name), moves: entry.moves, timeSeconds };
  }

  return null;
}

export function updateHighscores(
  scores,
  moves,
  timeSeconds,
  name = "Anonymous",
  limit = HIGHSCORE_LIMIT
) {
  const next = [
    ...scores.map(normalizeScoreEntry).filter(Boolean),
    {
      name: normalizePlayerName(name),
      moves,
      timeSeconds: Number.isFinite(timeSeconds) ? timeSeconds : null,
    },
  ];

  return next
    .sort(
      (a, b) =>
        a.moves - b.moves ||
        (a.timeSeconds ?? Number.MAX_SAFE_INTEGER) -
          (b.timeSeconds ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}

export function normalizeHighscoreEntries(scores) {
  return scores.map(normalizeScoreEntry).filter(Boolean);
}
