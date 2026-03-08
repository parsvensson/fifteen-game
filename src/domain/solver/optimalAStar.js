import { BOARD_SIZE } from "../../config.js";
import {
  createSolvedBoard,
  getMovableIndices,
  isSolved,
  isSolvable,
  isValidBoard,
  manhattanDistance,
  moveTile,
} from "../board.js";

function serializeBoard(board) {
  return board.join(",");
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
