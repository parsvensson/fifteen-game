import { normalizeHighscoreEntries } from "./game.js";

const HIGH_SCORES_KEY = "fifteen.highscores";

export function loadHighscores(
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(HIGH_SCORES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeHighscoreEntries(parsed);
  } catch {
    return [];
  }
}

export function saveHighscores(
  scores,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (!storage) {
    return;
  }

  storage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
}
