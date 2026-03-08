import { BOARD_SIZE } from "../../../config.js";
import { solveBoard } from "../optimalAStar.js";

export const optimalAStarPlugin = {
  id: "optimal-astar",
  label: "Optimal A*",
  version: "1.0.0",
  deterministic: true,
  supportsHints: false,
  maxRecommendedNodes: 100000,
  maxRecommendedTimeMs: 1500,
  solve(input) {
    const size = input?.size ?? BOARD_SIZE;
    const board = input?.board;
    const maxNodes = input?.limits?.maxNodes ?? 100000;
    const maxTimeMs = input?.limits?.maxTimeMs ?? 1500;
    const base = solveBoard(board, { size, maxNodes, maxTimeMs });
    return {
      ...base,
      telemetry: {
        algorithmId: this.id,
        algorithmVersion: this.version,
        deterministic: this.deterministic,
        seedUsed: Number.isFinite(input?.seed) ? input.seed : null,
      },
    };
  },
};
