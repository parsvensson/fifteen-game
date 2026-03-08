import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useShuffle } from "./useShuffle.js";

describe("useShuffle", () => {
  it("dispatches start, steps and end", async () => {
    vi.useFakeTimers();
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useShuffle({ dispatch, size: 4, steps: 3, delayMs: 10 })
    );

    await act(async () => {
      const run = result.current.runShuffle();
      await vi.runAllTimersAsync();
      await run;
    });

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "SHUFFLE_START", steps: 3 });
    expect(dispatch).toHaveBeenCalledWith({ type: "SHUFFLE_STEP", size: 4, step: 1 });
    expect(dispatch).toHaveBeenLastCalledWith({ type: "SHUFFLE_END" });
    expect(
      dispatch.mock.calls.filter(([action]) => action.type === "SHUFFLE_STEP")
    ).toHaveLength(3);
    vi.useRealTimers();
  });

  it("supports cancellation", async () => {
    vi.useFakeTimers();
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useShuffle({ dispatch, size: 4, steps: 10, delayMs: 1000 })
    );

    let run;
    await act(async () => {
      run = result.current.runShuffle();
    });
    act(() => {
      result.current.cancelShuffle();
    });
    await act(async () => {
      await run;
    });

    expect(dispatch).toHaveBeenCalledWith({ type: "SHUFFLE_END" });
    expect(
      dispatch.mock.calls.filter(([action]) => action.type === "SHUFFLE_STEP")
    ).toHaveLength(1);
    vi.useRealTimers();
  });
});
