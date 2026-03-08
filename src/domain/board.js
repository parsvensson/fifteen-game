import { BOARD_SIZE } from "../config.js";

export function createSolvedBoard(size = BOARD_SIZE) {
  const total = size * size;
  const board = Array.from({ length: total }, (_, index) => index + 1);
  board[total - 1] = 0;
  return board;
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

export function isSolved(board, size = BOARD_SIZE) {
  const solved = createSolvedBoard(size);
  return board.every((value, index) => value === solved[index]);
}

export function manhattanDistance(board, size = BOARD_SIZE) {
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

export function isValidBoard(board, size = BOARD_SIZE) {
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
