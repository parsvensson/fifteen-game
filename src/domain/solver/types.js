/**
 * @typedef {Object} SolverInput
 * @property {number[]} board
 * @property {number} size
 * @property {number | undefined} [seed]
 * @property {{ maxNodes: number, maxTimeMs: number, maxMoves?: number }} limits
 */

/**
 * @typedef {Object} SolverResult
 * @property {"found"|"solved"|"bounded"|"unsolvable"|"invalid"|"error"} status
 * @property {number[] | null} moves
 * @property {number} exploredNodes
 * @property {number} elapsedMs
 * @property {string | undefined} [reason]
 * @property {{
 *   algorithmId: string,
 *   algorithmVersion: string,
 *   deterministic: boolean,
 *   seedUsed: number | null,
 * }} telemetry
 */

/**
 * @typedef {Object} SolverPlugin
 * @property {string} id
 * @property {string} label
 * @property {string} version
 * @property {boolean} deterministic
 * @property {boolean} supportsHints
 * @property {number | undefined} [maxRecommendedNodes]
 * @property {number | undefined} [maxRecommendedTimeMs]
 * @property {(input: SolverInput) => Promise<SolverResult> | SolverResult} solve
 */

export const DEFAULT_SOLVER_ID = "optimal-astar";
