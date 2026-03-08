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

function serializeBoard(board) {
  return board.join(",");
}

function manhattanDistance(board, size = BOARD_SIZE) {
  let distance = 0;

  for (let index = 0; index < board.length; index += 1) {
    const value = board[index];
    if (value === 0) {
      continue;
    }

    const targetIndex = value - 1;
    const currentRow = Math.floor(index / size);
    const currentCol = index % size;
    const targetRow = Math.floor(targetIndex / size);
    const targetCol = targetIndex % size;
    distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
  }

  return distance;
}

function isValidBoard(board, size = BOARD_SIZE) {
  if (!Array.isArray(board) || board.length !== size * size) {
    return false;
  }

  const expected = new Set(Array.from({ length: size * size }, (_, index) => index));
  for (const value of board) {
    if (!Number.isInteger(value) || !expected.has(value)) {
      return false;
    }
    expected.delete(value);
  }

  return expected.size === 0;
}

export function isSolvable(board, size = BOARD_SIZE) {
  if (!isValidBoard(board, size)) {
    return false;
  }

  let inversions = 0;
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === 0) {
      continue;
    }

    for (let j = i + 1; j < board.length; j += 1) {
      if (board[j] === 0) {
        continue;
      }
      if (board[i] > board[j]) {
        inversions += 1;
      }
    }
  }

  if (size % 2 === 1) {
    return inversions % 2 === 0;
  }

  const emptyRowFromTop = Math.floor(findEmptyIndex(board) / size);
  const emptyRowFromBottom = size - emptyRowFromTop;
  if (emptyRowFromBottom % 2 === 0) {
    return inversions % 2 === 1;
  }

  return inversions % 2 === 0;
}

class MinHeap {
  constructor(compare) {
    this.compare = compare;
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(value) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) {
      return null;
    }

    const top = this.items[0];
    const tail = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = tail;
      this.bubbleDown(0);
    }

    return top;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parent]) >= 0) {
        break;
      }
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }

  bubbleDown(index) {
    const length = this.items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (left < length && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }

      if (right < length && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}

function reconstructMoves(node) {
  const moves = [];
  let current = node;
  while (current && current.moveIndex !== null) {
    moves.push(current.moveIndex);
    current = current.parent;
  }

  return moves.reverse();
}

export function solveBoard(
  board,
  {
    size = BOARD_SIZE,
    maxNodes = 100000,
    maxTimeMs = 1500,
  } = {}
) {
  const startedAt = Date.now();

  if (!isValidBoard(board, size)) {
    return { status: "invalid", moves: null, exploredNodes: 0, elapsedMs: 0 };
  }

  if (isSolved(board, size)) {
    return { status: "solved", moves: [], exploredNodes: 0, elapsedMs: 0 };
  }

  if (!isSolvable(board, size)) {
    return { status: "unsolvable", moves: null, exploredNodes: 0, elapsedMs: 0 };
  }

  const goalKey = serializeBoard(createSolvedBoard(size));
  const open = new MinHeap((a, b) => a.f - b.f || a.h - b.h || a.order - b.order);
  const bestCostByState = new Map();
  let exploredNodes = 0;
  let order = 0;

  const startNode = {
    board,
    key: serializeBoard(board),
    g: 0,
    h: manhattanDistance(board, size),
    f: manhattanDistance(board, size),
    parent: null,
    moveIndex: null,
    order,
  };

  open.push(startNode);
  bestCostByState.set(startNode.key, 0);

  while (open.size > 0) {
    if (exploredNodes >= maxNodes) {
      return {
        status: "bounded",
        moves: null,
        exploredNodes,
        elapsedMs: Date.now() - startedAt,
      };
    }

    if (Date.now() - startedAt > maxTimeMs) {
      return {
        status: "bounded",
        moves: null,
        exploredNodes,
        elapsedMs: Date.now() - startedAt,
      };
    }

    const current = open.pop();
    if (!current) {
      break;
    }

    const bestCost = bestCostByState.get(current.key);
    if (bestCost !== undefined && current.g > bestCost) {
      continue;
    }

    exploredNodes += 1;
    if (current.key === goalKey) {
      return {
        status: "found",
        moves: reconstructMoves(current),
        exploredNodes,
        elapsedMs: Date.now() - startedAt,
      };
    }

    const neighbors = getMovableIndices(current.board, size)
      .map((index) => ({ index, value: current.board[index] }))
      .sort((a, b) => a.value - b.value || a.index - b.index);

    for (const neighbor of neighbors) {
      const moved = moveTile(current.board, neighbor.index, size);
      if (!moved.moved) {
        continue;
      }

      const nextBoard = moved.board;
      const nextKey = serializeBoard(nextBoard);
      const nextG = current.g + 1;
      const knownCost = bestCostByState.get(nextKey);
      if (knownCost !== undefined && nextG >= knownCost) {
        continue;
      }

      bestCostByState.set(nextKey, nextG);
      const nextH = manhattanDistance(nextBoard, size);
      order += 1;

      open.push({
        board: nextBoard,
        key: nextKey,
        g: nextG,
        h: nextH,
        f: nextG + nextH,
        parent: current,
        moveIndex: neighbor.index,
        order,
      });
    }
  }

  return {
    status: "bounded",
    moves: null,
    exploredNodes,
    elapsedMs: Date.now() - startedAt,
  };
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
    return { name: "Anonymous", moves: entry, timeSeconds: null, solvedAt: null };
  }

  if (
    entry &&
    typeof entry === "object" &&
    Number.isFinite(entry.moves)
  ) {
    const timeSeconds = Number.isFinite(entry.timeSeconds) ? entry.timeSeconds : null;
    const solvedAt = typeof entry.solvedAt === "string" ? entry.solvedAt : null;
    return {
      name: normalizePlayerName(entry.name),
      moves: entry.moves,
      timeSeconds,
      solvedAt,
    };
  }

  return null;
}

export function updateHighscores(
  scores,
  moves,
  timeSeconds,
  name = "Anonymous",
  limit = HIGHSCORE_LIMIT,
  solvedAt = null
) {
  const next = [
    ...scores.map(normalizeScoreEntry).filter(Boolean),
    {
      name: normalizePlayerName(name),
      moves,
      timeSeconds: Number.isFinite(timeSeconds) ? timeSeconds : null,
      solvedAt: typeof solvedAt === "string" ? solvedAt : null,
    },
  ];

  return next
    .sort(
      (a, b) =>
        a.moves - b.moves ||
        (a.timeSeconds ?? Number.MAX_SAFE_INTEGER) -
          (b.timeSeconds ?? Number.MAX_SAFE_INTEGER) ||
        (b.solvedAt ?? "").localeCompare(a.solvedAt ?? "") ||
        a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}

export function normalizeHighscoreEntries(scores) {
  return scores.map(normalizeScoreEntry).filter(Boolean);
}
