export {
  createGameState,
  gameReducer,
  applyMove,
  GAME_LIFECYCLE,
} from "./domain/gameState.js";
export {
  createSolvedBoard,
  findEmptyIndex,
  getMovableIndices,
  isSolved,
  isSolvable,
  moveTile,
  shuffleBoard,
} from "./domain/board.js";
export { solveBoard } from "./domain/solver/optimalAStar.js";
export { DEFAULT_SOLVER_ID } from "./domain/solver/types.js";
export {
  getSolverPlugin,
  listSolverPlugins,
  registerSolverPlugin,
  solveWithPlugin,
} from "./domain/solver/registry.js";
export {
  normalizeHighscoreEntries,
  updateHighscores,
} from "./domain/highscores.js";
export {
  GAME_EVENT_TYPES,
  MAX_GAME_EVENT_HISTORY,
} from "./domain/gameEvents.js";
