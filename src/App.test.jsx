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
  const originalConfirm = window.confirm;

  beforeEach(() => {
    window.localStorage.clear();
    window.prompt = vi.fn(() => "Player");
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => cleanup());
  afterEach(() => {
    vi.useRealTimers();
    window.prompt = originalPrompt;
    window.confirm = originalConfirm;
  });

  it("does not show fireworks on initial load", () => {
    render(<App />);
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
  });

  it("shows fireworks after solving the puzzle", () => {
    vi.useFakeTimers();
    render(<App />);
    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    fireEvent.click(tile);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Highscores" }));
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText(/2 moves · 0:00/i)).toBeInTheDocument();
    expect(screen.queryByText(/unknown date/i)).not.toBeInTheDocument();
  });

  it("resets highscores after confirmation", () => {
    vi.useFakeTimers();
    render(<App />);
    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    fireEvent.click(tile);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByRole("tab", { name: "Highscores" }));
    expect(screen.getByText("Player")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("No scores yet")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Time: 0:02")).toBeInTheDocument();

    fireEvent.click(tile);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByLabelText("Time: 0:02")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Time: 0:02")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    expect(screen.getByLabelText("Time: 0:00")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("shows robot status transitions from idle to running to done", () => {
    vi.useFakeTimers();
    render(<App />);

    expect(screen.getByText("Robot idle")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Robot" }));
    expect(screen.getByText("Robot running")).toBeInTheDocument();

    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByText("Robot done")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("executes robot moves and solves an unsolved board", () => {
    vi.useFakeTimers();
    render(<App />);

    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    expect(screen.getByText("In progress")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Robot" }));
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByText("Solved!")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("disables tabs and tiles while robot is running, but shuffle cancels", () => {
    vi.useFakeTimers();
    render(<App />);

    const tile = screen.getByRole("button", { name: "15" });
    fireEvent.click(tile);
    fireEvent.click(screen.getByRole("button", { name: "Robot" }));

    expect(screen.getByRole("button", { name: "Robot..." })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Highscores" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "15" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    expect(screen.getByText("Robot idle")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
