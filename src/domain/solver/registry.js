import { DEFAULT_SOLVER_ID } from "./types.js";
import { optimalAStarPlugin } from "./plugins/optimalAStarPlugin.js";

const registry = new Map();

function validatePlugin(plugin) {
  if (!plugin || typeof plugin !== "object") {
    throw new Error("Solver plugin must be an object");
  }
  if (!plugin.id || typeof plugin.id !== "string") {
    throw new Error("Solver plugin must define a string id");
  }
  if (!plugin.label || typeof plugin.label !== "string") {
    throw new Error(`Solver plugin ${plugin.id} must define a label`);
  }
  if (!plugin.version || typeof plugin.version !== "string") {
    throw new Error(`Solver plugin ${plugin.id} must define a version`);
  }
  if (typeof plugin.solve !== "function") {
    throw new Error(`Solver plugin ${plugin.id} must define solve()`);
  }
  if (typeof plugin.deterministic !== "boolean") {
    throw new Error(`Solver plugin ${plugin.id} must define deterministic`);
  }
  if (typeof plugin.supportsHints !== "boolean") {
    throw new Error(`Solver plugin ${plugin.id} must define supportsHints`);
  }
}

export function registerSolverPlugin(plugin) {
  validatePlugin(plugin);
  registry.set(plugin.id, plugin);
  return plugin;
}

export function getSolverPlugin(id = DEFAULT_SOLVER_ID) {
  return registry.get(id) ?? null;
}

export function listSolverPlugins() {
  return Array.from(registry.values());
}

export function resetSolverRegistry() {
  registry.clear();
  registerSolverPlugin(optimalAStarPlugin);
}

export function solveWithPlugin(
  input,
  {
    solverId = DEFAULT_SOLVER_ID,
  } = {}
) {
  const plugin = getSolverPlugin(solverId);
  if (!plugin) {
    return {
      status: "error",
      moves: null,
      exploredNodes: 0,
      elapsedMs: 0,
      reason: `unknown-solver:${solverId}`,
      telemetry: {
        algorithmId: solverId,
        algorithmVersion: "unknown",
        deterministic: false,
        seedUsed: Number.isFinite(input?.seed) ? input.seed : null,
      },
    };
  }

  try {
    const result = plugin.solve(input);
    if (result && typeof result.then === "function") {
      return {
        status: "error",
        moves: null,
        exploredNodes: 0,
        elapsedMs: 0,
        reason: "async-solver-not-supported-in-main-thread",
        telemetry: {
          algorithmId: plugin.id,
          algorithmVersion: plugin.version,
          deterministic: plugin.deterministic,
          seedUsed: Number.isFinite(input?.seed) ? input.seed : null,
        },
      };
    }
    return result;
  } catch (error) {
    return {
      status: "error",
      moves: null,
      exploredNodes: 0,
      elapsedMs: 0,
      reason: error instanceof Error ? error.message : "solver-crash",
      telemetry: {
        algorithmId: plugin.id,
        algorithmVersion: plugin.version,
        deterministic: plugin.deterministic,
        seedUsed: Number.isFinite(input?.seed) ? input.seed : null,
      },
    };
  }
}

resetSolverRegistry();
