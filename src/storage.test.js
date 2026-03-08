import { describe, expect, it } from "vitest";
import { loadHighscores, saveHighscores } from "./storage.js";

describe("storage", () => {
  it("loads and saves named scores using storage", () => {
    const storage = (() => {
      let data = {};
      return {
        getItem: (key) => data[key] ?? null,
        setItem: (key, value) => {
          data[key] = value;
        },
      };
    })();

    saveHighscores(
      [
        { name: "Lin", moves: 3 },
        { name: "Max", moves: 7 },
      ],
      storage
    );
    expect(loadHighscores(storage)).toEqual([
      { name: "Lin", moves: 3 },
      { name: "Max", moves: 7 },
    ]);
  });

  it("normalizes legacy numeric scores from storage", () => {
    const storage = {
      getItem: () => JSON.stringify([4, 6]),
      setItem: () => {},
    };

    expect(loadHighscores(storage)).toEqual([
      { name: "Anonymous", moves: 4 },
      { name: "Anonymous", moves: 6 },
    ]);
  });
});
