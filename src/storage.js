import { normalizeHighscoreEntries } from "./game.js";

const HIGH_SCORES_KEY = "fifteen.highscores";

function getDefaultStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadHighscores(
  storage = getDefaultStorage()
) {
  if (!storage || typeof storage.getItem !== "function") {
    return [];
  }

  let raw = null;
  try {
    raw = storage.getItem(HIGH_SCORES_KEY);
  } catch {
    return [];
  }

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
  storage = getDefaultStorage()
) {
  if (!storage || typeof storage.setItem !== "function") {
    return;
  }

  try {
    storage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  } catch {
    // Swallow storage failures so gameplay is not interrupted.
  }
}
