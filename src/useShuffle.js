import React from "react";

export function useShuffle({ dispatch, size, steps, delayMs }) {
  const isCancelled = React.useRef(false);
  const isRunning = React.useRef(false);
  const timeoutRef = React.useRef(null);
  const pendingResolveRef = React.useRef(null);

  const clearPendingDelay = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingResolveRef.current) {
      const resolve = pendingResolveRef.current;
      pendingResolveRef.current = null;
      resolve();
    }
  }, []);

  const waitDelay = React.useCallback(
    () =>
      new Promise((resolve) => {
        pendingResolveRef.current = () => resolve();
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          const done = pendingResolveRef.current;
          pendingResolveRef.current = null;
          done?.();
        }, delayMs);
      }),
    [delayMs]
  );

  const cancelShuffle = React.useCallback(() => {
    isCancelled.current = true;
    clearPendingDelay();
  }, [clearPendingDelay]);

  const runShuffle = React.useCallback(async () => {
    if (isRunning.current) {
      return;
    }

    isCancelled.current = false;
    isRunning.current = true;
    dispatch({ type: "SHUFFLE_START" });

    for (let step = 0; step < steps; step += 1) {
      if (isCancelled.current) {
        break;
      }
      dispatch({ type: "SHUFFLE_STEP", size });
      await waitDelay();
    }

    dispatch({ type: "SHUFFLE_END" });
    isRunning.current = false;
  }, [dispatch, size, steps, waitDelay]);

  React.useEffect(
    () => () => {
      isCancelled.current = true;
      clearPendingDelay();
    },
    [clearPendingDelay]
  );

  return { runShuffle, cancelShuffle };
}
