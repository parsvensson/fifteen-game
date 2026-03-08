import { HIGHSCORE_LIMIT } from "../config.js";

function normalizePlayerName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed || "Anonymous";
}

function normalizeScoreEntry(entry) {
  if (typeof entry === "number" && Number.isFinite(entry)) {
    return { name: "Anonymous", moves: entry, timeSeconds: null, solvedAt: null };
  }

  if (entry && typeof entry === "object" && Number.isFinite(entry.moves)) {
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
