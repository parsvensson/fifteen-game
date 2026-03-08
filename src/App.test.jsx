import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App.jsx";

describe("App fireworks", () => {
  afterEach(() => cleanup());

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
  });

  it("renders slide instructions", () => {
    render(<App />);
    expect(
      screen.getByText(/click a tile next to the empty space to slide it/i)
    ).toBeInTheDocument();
  });
});
