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
        { name: "Lin", moves: 3, timeSeconds: 22 },
        { name: "Max", moves: 7, timeSeconds: 40 },
      ],
      storage
    );
    expect(loadHighscores(storage)).toEqual([
      { name: "Lin", moves: 3, timeSeconds: 22, solvedAt: null },
      { name: "Max", moves: 7, timeSeconds: 40, solvedAt: null },
    ]);
  });

  it("normalizes legacy numeric scores from storage", () => {
    const storage = {
      getItem: () => JSON.stringify([4, 6]),
      setItem: () => {},
    };

    expect(loadHighscores(storage)).toEqual([
      { name: "Anonymous", moves: 4, timeSeconds: null, solvedAt: null },
      { name: "Anonymous", moves: 6, timeSeconds: null, solvedAt: null },
    ]);
  });

  it("returns empty list when storage read throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
    };

    expect(loadHighscores(storage)).toEqual([]);
  });

  it("swallows storage write failures", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };

    expect(() => saveHighscores([{ name: "A", moves: 1 }], storage)).not.toThrow();
  });
});
