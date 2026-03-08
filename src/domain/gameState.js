import { BOARD_SIZE } from "../config.js";
import { findEmptyIndex, createSolvedBoard, getMovableIndices, isSolved, moveTile } from "./board.js";
import {
  appendGameEvent,
  createGameEvent,
  GAME_EVENT_TYPES,
} from "./gameEvents.js";

export const GAME_LIFECYCLE = {
  IDLE: "idle",
  PLAYING: "playing",
  SHUFFLING: "shuffling",
  AUTOSOLVING: "autosolving",
  SOLVED: "solved",
  NAME_CAPTURE: "name-capture",
};

export function createGameState(size = BOARD_SIZE) {
  return {
    board: createSolvedBoard(size),
    moves: 0,
    isShuffling: false,
    lifecycle: GAME_LIFECYCLE.IDLE,
    events: [],
  };
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

export function gameReducer(state, action) {
  switch (action.type) {
    case "MOVE_TILE": {
      if (
        state.lifecycle === GAME_LIFECYCLE.SHUFFLING ||
        state.lifecycle === GAME_LIFECYCLE.NAME_CAPTURE
      ) {
        return state;
      }

      const next = applyMove(state, action.index, action.size ?? BOARD_SIZE);
      if (!next.moved) {
        return state;
      }

      const nextState = {
        ...state,
        board: next.board,
        moves: next.moves,
        lifecycle: GAME_LIFECYCLE.PLAYING,
      };
      const nextEmpty = findEmptyIndex(next.board);
      const withMoveEvent = appendGameEvent(
        nextState,
        createGameEvent(GAME_EVENT_TYPES.MOVE_APPLIED, {
          source: action.source ?? "player",
          tileIndex: action.index,
          from: nextEmpty,
          to: findEmptyIndex(state.board),
        })
      );

      if (action.source === "solve") {
        return appendGameEvent(
          withMoveEvent,
          createGameEvent(GAME_EVENT_TYPES.SOLVE_STEP_APPLIED, {
            moveIndex: action.index,
            step: action.step ?? null,
          })
        );
      }

      return withMoveEvent;
    }

    case "SHUFFLE_START":
      return appendGameEvent({
        ...state,
        isShuffling: true,
        moves: 0,
        lifecycle: GAME_LIFECYCLE.SHUFFLING,
      }, createGameEvent(GAME_EVENT_TYPES.SHUFFLE_STARTED, {
        steps: action.steps ?? null,
        seed: Number.isFinite(action.seed) ? action.seed : null,
      }));

    case "SHUFFLE_STEP": {
      const size = action.size ?? BOARD_SIZE;
      const rng = action.rng ?? Math.random;
      const movable = getMovableIndices(state.board, size);
      const tileIndex = movable[Math.floor(rng() * movable.length)];
      const moved = moveTile(state.board, tileIndex, size);
      if (!moved.moved) {
        return state;
      }

      return appendGameEvent({
        ...state,
        board: moved.board,
        moves: 0,
      }, createGameEvent(GAME_EVENT_TYPES.SHUFFLE_STEP_APPLIED, {
        step: action.step ?? null,
        tileIndex,
      }));
    }

    case "SHUFFLE_END":
      return appendGameEvent({
        ...state,
        isShuffling: false,
        lifecycle: isSolved(state.board, action.size ?? BOARD_SIZE)
          ? GAME_LIFECYCLE.IDLE
          : GAME_LIFECYCLE.PLAYING,
      }, createGameEvent(GAME_EVENT_TYPES.SHUFFLE_COMPLETED));

    case "AUTOSOLVE_START":
      if (state.lifecycle === GAME_LIFECYCLE.SHUFFLING) {
        return state;
      }
      return appendGameEvent({
        ...state,
        lifecycle: GAME_LIFECYCLE.AUTOSOLVING,
      }, createGameEvent(GAME_EVENT_TYPES.SOLVE_STARTED, {
        solverId: action.solverId ?? "unknown",
        limits: action.limits ?? null,
      }));

    case "AUTOSOLVE_STOP":
      return appendGameEvent({
        ...state,
        lifecycle:
          action.nextLifecycle ??
          (isSolved(state.board, action.size ?? BOARD_SIZE)
            ? GAME_LIFECYCLE.SOLVED
            : GAME_LIFECYCLE.PLAYING),
      }, createGameEvent(GAME_EVENT_TYPES.SOLVE_COMPLETED, {
        solverId: action.solverId ?? "unknown",
        status: action.status ?? "unknown",
        elapsedMs: action.elapsedMs ?? null,
      }));

    case "BOARD_SOLVED":
      return {
        ...state,
        lifecycle: GAME_LIFECYCLE.SOLVED,
      };

    case "NAME_CAPTURE_START":
      return {
        ...state,
        lifecycle: GAME_LIFECYCLE.NAME_CAPTURE,
      };

    case "NAME_CAPTURE_END":
      return {
        ...state,
        lifecycle: GAME_LIFECYCLE.IDLE,
      };

    case "SCORE_SAVED":
      return appendGameEvent(state, createGameEvent(GAME_EVENT_TYPES.SCORE_SAVED, {
        name: action.name,
        moves: action.moves,
        timeSeconds: action.timeSeconds,
      }));

    default:
      return state;
  }
}
