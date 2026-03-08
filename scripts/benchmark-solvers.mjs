import { getBenchmarkBoards } from "../src/domain/fixtures/boardFixtures.js";
import { DEFAULT_SOLVER_ID, solveWithPlugin } from "../src/game.js";

const limits = { maxNodes: 100000, maxTimeMs: 1500 };
const solverId = process.argv[2] ?? DEFAULT_SOLVER_ID;
const corpus = getBenchmarkBoards();

const results = [];
for (const entry of corpus) {
  // eslint-disable-next-line no-await-in-loop
  const result = await solveWithPlugin(
    {
      board: entry.board,
      size: 4,
      limits,
    },
    { solverId }
  );

  results.push({
    id: entry.id,
    difficulty: entry.difficulty,
    status: result.status,
    moveCount: result.moves?.length ?? null,
    elapsedMs: result.elapsedMs,
    exploredNodes: result.exploredNodes,
  });
}

console.log(
  JSON.stringify(
    {
      solverId,
      limits,
      totalBoards: results.length,
      solvedBoards: results.filter((item) => item.status === "found" || item.status === "solved").length,
      results,
    },
    null,
    2
  )
);
