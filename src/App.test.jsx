import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

vi.mock("fireworks-js", () => ({
  Fireworks: class {
    start() {}
    stop() {}
    clear() {}
  },
}));

describe("App fireworks", () => {
  const originalPrompt = window.prompt;

  beforeEach(() => {
    window.localStorage.clear();
    window.prompt = vi.fn(() => "Player");
  });

  afterEach(() => cleanup());
  afterEach(() => {
    window.prompt = originalPrompt;
  });

  it("does not show fireworks on initial load", () => {
    render(<App />);
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
  });

  it("shows fireworks after solving the puzzle", () => {
    render(<App />);
    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    fireEvent.click(tile);
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
  });

  it("renders slide instructions", () => {
    render(<App />);
    expect(
      screen.getByText(/click a tile next to the empty space to slide it/i)
    ).toBeInTheDocument();
  });
});
