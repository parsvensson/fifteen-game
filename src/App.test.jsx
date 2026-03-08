import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    vi.useRealTimers();
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

  it("starts on first move and pauses when solved", () => {
    vi.useFakeTimers();
    render(<App />);

    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Time: 0:02")).toBeInTheDocument();

    fireEvent.click(tile);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Time: 0:02")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("resets timer on shuffle", () => {
    vi.useFakeTimers();
    render(<App />);

    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Time: 0:02")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    expect(screen.getByText("Time: 0:00")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
