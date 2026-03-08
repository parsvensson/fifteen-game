export const GAME_EVENT_TYPES = {
  MOVE_APPLIED: "MOVE_APPLIED",
  SHUFFLE_STARTED: "SHUFFLE_STARTED",
  SHUFFLE_STEP_APPLIED: "SHUFFLE_STEP_APPLIED",
  SHUFFLE_COMPLETED: "SHUFFLE_COMPLETED",
  SOLVE_STARTED: "SOLVE_STARTED",
  SOLVE_STEP_APPLIED: "SOLVE_STEP_APPLIED",
  SOLVE_COMPLETED: "SOLVE_COMPLETED",
  SCORE_SAVED: "SCORE_SAVED",
};

export const MAX_GAME_EVENT_HISTORY = 500;

export function createGameEvent(type, payload = {}, at = new Date().toISOString()) {
  return { type, at, ...payload };
}

export function appendGameEvent(state, event) {
  const nextEvents = [...state.events, event];
  const start = Math.max(0, nextEvents.length - MAX_GAME_EVENT_HISTORY);
  return {
    ...state,
    events: nextEvents.slice(start),
  };
}
