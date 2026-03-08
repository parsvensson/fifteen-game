import React from "react";
import {
  BOARD_SIZE,
  FIREWORKS_DURATION_MS,
  HIGHSCORE_LIMIT,
  SHUFFLE_DELAY_MS,
  SHUFFLE_STEPS,
  TILE_SLIDE_DURATION_MS,
} from "./config.js";
import {
  createGameState,
  gameReducer,
  getMovableIndices,
  isSolved,
  solveBoard,
  updateHighscores,
} from "./game.js";
import { loadHighscores, saveHighscores } from "./storage.js";
import { useShuffle } from "./useShuffle.js";
import { formatElapsed } from "./time.js";
import { Board } from "./components/Board.jsx";
import { FireworksLayer } from "./components/FireworksLayer.jsx";
import { Header } from "./components/Header.jsx";
import { Highscores } from "./components/Highscores.jsx";
import { ScoreStrip } from "./components/ScoreStrip.jsx";

const defaultPlayerName = "Anonymous";
const SOLVE_PROMPT_DELAY_MS = TILE_SLIDE_DURATION_MS + 30;
const AUTOSOLVE_STEP_DELAY_MS = TILE_SLIDE_DURATION_MS + 20;

export default function App() {
  const [game, dispatch] = React.useReducer(
    gameReducer,
    BOARD_SIZE,
    createGameState
  );
  const [highscores, setHighscores] = React.useState(() => loadHighscores());
  const [activeScreen, setActiveScreen] = React.useState("game");
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [autosolveStatus, setAutosolveStatus] = React.useState("idle");
  const movable = getMovableIndices(game.board, BOARD_SIZE);
  const solved = isSolved(game.board, BOARD_SIZE);
  const isAutosolving = autosolveStatus === "running";
  const celebrate = solved && game.moves > 0 && !game.isShuffling;
  const timerRunning = game.moves > 0 && !solved && !game.isShuffling;
  const previousSolved = React.useRef(solved);
  const tileRefs = React.useRef(new Map());
  const previousTileRects = React.useRef(new Map());
  const shouldAnimateTiles = React.useRef(false);
  const autosolveRunRef = React.useRef({ token: 0, timeoutId: null });
  const fireworksContainerRef = React.useRef(null);
  const { runShuffle } = useShuffle({
    dispatch,
    size: BOARD_SIZE,
    steps: SHUFFLE_STEPS,
    delayMs: SHUFFLE_DELAY_MS,
  });

  const clearAutosolveDelay = React.useCallback(() => {
    if (autosolveRunRef.current.timeoutId) {
      clearTimeout(autosolveRunRef.current.timeoutId);
      autosolveRunRef.current.timeoutId = null;
    }
  }, []);

  const cancelAutosolve = React.useCallback(() => {
    autosolveRunRef.current.token += 1;
    clearAutosolveDelay();
  }, [clearAutosolveDelay]);

  const waitForAutosolveStep = React.useCallback(
    (token) =>
      new Promise((resolve) => {
        autosolveRunRef.current.timeoutId = setTimeout(() => {
          autosolveRunRef.current.timeoutId = null;
          resolve(autosolveRunRef.current.token === token);
        }, AUTOSOLVE_STEP_DELAY_MS);
      }),
    []
  );

  React.useEffect(() => () => cancelAutosolve(), [cancelAutosolve]);

  function getPlayerName() {
    if (typeof window === "undefined" || typeof window.prompt !== "function") {
      return defaultPlayerName;
    }

    try {
      const input = window.prompt("You solved it! Enter your name for highscores:", "");
      const trimmed = typeof input === "string" ? input.trim() : "";
      return trimmed || defaultPlayerName;
    } catch {
      return defaultPlayerName;
    }
  }

  React.useEffect(() => {
    if (!(solved && !previousSolved.current && game.moves > 0)) {
      previousSolved.current = solved;
      return undefined;
    }

    const timerId = setTimeout(() => {
      const name = getPlayerName();
      setHighscores((prev) => {
        const updated = updateHighscores(
          prev,
          game.moves,
          elapsedSeconds,
          name,
          HIGHSCORE_LIMIT,
          new Date().toISOString()
        );
        saveHighscores(updated);
        return updated;
      });
    }, SOLVE_PROMPT_DELAY_MS);

    previousSolved.current = solved;
    return () => clearTimeout(timerId);
  }, [elapsedSeconds, solved, game.moves]);

  React.useEffect(() => {
    if (!timerRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerRunning]);

  React.useLayoutEffect(() => {
    const nextTileRects = new Map();
    tileRefs.current.forEach((node, value) => {
      nextTileRects.set(value, node.getBoundingClientRect());
    });

    if (shouldAnimateTiles.current && previousTileRects.current.size > 0) {
      tileRefs.current.forEach((node, value) => {
        const previousRect = previousTileRects.current.get(value);
        const nextRect = nextTileRects.get(value);
        if (!previousRect || !nextRect) {
          return;
        }

        const deltaX = previousRect.left - nextRect.left;
        const deltaY = previousRect.top - nextRect.top;
        if (deltaX === 0 && deltaY === 0) {
          return;
        }

        node.style.transition = "none";
        node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        node.getBoundingClientRect();
        node.style.transition = `transform ${TILE_SLIDE_DURATION_MS}ms ease`;
        node.style.transform = "";
      });
    }

    previousTileRects.current = nextTileRects;
    shouldAnimateTiles.current = false;
  }, [game.board]);

  React.useEffect(() => {
    if (!celebrate || !fireworksContainerRef.current) {
      return undefined;
    }

    let disposed = false;
    let stopTimer;
    let fireworks = null;

    async function startCelebration() {
      const { Fireworks } = await import("fireworks-js");
      if (disposed || !fireworksContainerRef.current) {
        return;
      }

      fireworks = new Fireworks(fireworksContainerRef.current, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.02,
        particles: 45,
        traceLength: 2,
      });
      fireworks.start();
      stopTimer = setTimeout(() => {
        fireworks?.stop();
      }, FIREWORKS_DURATION_MS);
    }

    startCelebration();

    return () => {
      disposed = true;
      clearTimeout(stopTimer);
      fireworks?.stop();
      fireworks?.clear();
    };
  }, [celebrate]);

  React.useEffect(() => {
    if (activeScreen !== "game" && isAutosolving) {
      cancelAutosolve();
      setAutosolveStatus("idle");
    }
  }, [activeScreen, isAutosolving, cancelAutosolve]);

  function handleTileClick(index) {
    if (game.isShuffling || isAutosolving) {
      return;
    }

    if (autosolveStatus !== "idle") {
      setAutosolveStatus("idle");
    }

    shouldAnimateTiles.current = true;
    dispatch({ type: "MOVE_TILE", index, size: BOARD_SIZE });
  }

  async function handleShuffle() {
    if (game.isShuffling) {
      return;
    }

    if (isAutosolving) {
      cancelAutosolve();
    }

    if (autosolveStatus !== "idle") {
      setAutosolveStatus("idle");
    }

    setElapsedSeconds(0);
    await runShuffle();
  }

  function handleRobotSolve() {
    if (game.isShuffling || isAutosolving || activeScreen !== "game") {
      return;
    }

    cancelAutosolve();
    const token = autosolveRunRef.current.token;
    setAutosolveStatus("running");

    setTimeout(async () => {
      if (autosolveRunRef.current.token !== token) {
        return;
      }

      const result = solveBoard(game.board, { size: BOARD_SIZE });
      if (autosolveRunRef.current.token !== token) {
        return;
      }

      if (result.status === "solved") {
        setAutosolveStatus("done");
        return;
      }

      if (result.status !== "found" || !result.moves || result.moves.length === 0) {
        setAutosolveStatus("error");
        return;
      }

      for (const moveIndex of result.moves) {
        if (autosolveRunRef.current.token !== token) {
          return;
        }

        shouldAnimateTiles.current = true;
        dispatch({ type: "MOVE_TILE", index: moveIndex, size: BOARD_SIZE });
        const stillCurrent = await waitForAutosolveStep(token);
        if (!stillCurrent) {
          return;
        }
      }

      if (autosolveRunRef.current.token !== token) {
        return;
      }

      setAutosolveStatus("done");
    }, 0);
  }

  function handleResetHighscores() {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const accepted = window.confirm("Clear all highscores?");
      if (!accepted) {
        return;
      }
    }

    setHighscores([]);
    saveHighscores([]);
  }

  const setTileRef = React.useCallback(
    (value) => (node) => {
      if (node) {
        tileRefs.current.set(value, node);
      } else {
        tileRefs.current.delete(value);
      }
    },
    []
  );

  return (
    <div className="app">
      <Header
        solved={solved}
        isShuffling={game.isShuffling}
        isAutosolving={isAutosolving}
        autosolveStatus={autosolveStatus}
        activeScreen={activeScreen}
        onShowGame={() => setActiveScreen("game")}
        onShowHighscores={() => setActiveScreen("highscores")}
        onShuffle={handleShuffle}
        onRobotSolve={handleRobotSolve}
      />
      {activeScreen === "game" ? (
        <section className="game-screen screen-fade-in">
          <ScoreStrip moves={game.moves} elapsed={formatElapsed(elapsedSeconds)} />
          <p className="instructions">
            Click a tile next to the empty space to slide it.
          </p>
          <Board
            board={game.board}
            movable={movable}
            isShuffling={game.isShuffling}
            isAutosolving={isAutosolving}
            onTileClick={handleTileClick}
            setTileRef={setTileRef}
          />
          <FireworksLayer
            celebrate={celebrate}
            fireworksContainerRef={fireworksContainerRef}
          />
        </section>
      ) : (
        <Highscores highscores={highscores} onReset={handleResetHighscores} />
      )}
    </div>
  );
}
