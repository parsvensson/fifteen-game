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
  DEFAULT_SOLVER_ID,
  GAME_LIFECYCLE,
  gameReducer,
  getMovableIndices,
  isSolved,
  solveWithPlugin,
  updateHighscores,
} from "./ui/reactGameAdapter.js";
import { loadHighscores, saveHighscores } from "./storage.js";
import { useShuffle } from "./useShuffle.js";
import { formatElapsed } from "./time.js";
import { Board } from "./components/Board.jsx";
import { FireworksLayer } from "./components/FireworksLayer.jsx";
import { Header } from "./components/Header.jsx";
import { Highscores } from "./components/Highscores.jsx";
import { NameModal } from "./components/NameModal.jsx";
import { ScoreStrip } from "./components/ScoreStrip.jsx";

const defaultPlayerName = "Anonymous";
const SOLVE_PROMPT_DELAY_MS = 900;
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
  const [pendingSolve, setPendingSolve] = React.useState(null);
  const [namePromptSolve, setNamePromptSolve] = React.useState(null);
  const [nameInput, setNameInput] = React.useState("");
  const [celebrationStartedAt, setCelebrationStartedAt] = React.useState(null);
  const movable = getMovableIndices(game.board, BOARD_SIZE);
  const lifecycle = game.lifecycle ?? GAME_LIFECYCLE.IDLE;
  const solved = isSolved(game.board, BOARD_SIZE);
  const isAutosolving = lifecycle === GAME_LIFECYCLE.AUTOSOLVING;
  const isShuffling = lifecycle === GAME_LIFECYCLE.SHUFFLING;
  const isNameCapture = lifecycle === GAME_LIFECYCLE.NAME_CAPTURE;
  const celebrate = solved && game.moves > 0 && !isShuffling;
  const timerRunning = lifecycle === GAME_LIFECYCLE.PLAYING && game.moves > 0 && !solved;
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

  const saveSolvedScore = React.useCallback((solve, rawName) => {
    if (!solve) {
      return;
    }

    const trimmed = typeof rawName === "string" ? rawName.trim() : "";
    const name = trimmed || defaultPlayerName;
    setHighscores((prev) => {
      const updated = updateHighscores(
        prev,
        solve.moves,
        solve.elapsed,
        name,
        HIGHSCORE_LIMIT,
        new Date().toISOString()
      );
      saveHighscores(updated);
      return updated;
    });
  }, []);

  React.useEffect(() => {
    if (!(solved && !previousSolved.current && game.moves > 0)) {
      previousSolved.current = solved;
      return undefined;
    }

    dispatch({ type: "BOARD_SOLVED" });
    setCelebrationStartedAt(null);
    setPendingSolve({
      moves: game.moves,
      elapsed: elapsedSeconds,
      solvedAt: Date.now(),
    });
    previousSolved.current = solved;
  }, [elapsedSeconds, solved, game.moves]);

  React.useEffect(() => {
    if (!pendingSolve) {
      return undefined;
    }

    const baseTime = celebrationStartedAt ?? pendingSolve.solvedAt;
    const waitMs = Math.max(0, baseTime + SOLVE_PROMPT_DELAY_MS - Date.now());
    const timerId = setTimeout(() => {
      dispatch({ type: "NAME_CAPTURE_START" });
      setNamePromptSolve(pendingSolve);
      setNameInput("");
      setPendingSolve(null);
      setCelebrationStartedAt(null);
    }, waitMs);

    return () => clearTimeout(timerId);
  }, [celebrationStartedAt, pendingSolve]);

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
      try {
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
        setCelebrationStartedAt(Date.now());
        stopTimer = setTimeout(() => {
          fireworks?.stop();
        }, FIREWORKS_DURATION_MS);
      } catch {
        if (!disposed) {
          setCelebrationStartedAt(Date.now());
        }
      }
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
      dispatch({
        type: "AUTOSOLVE_STOP",
        nextLifecycle: GAME_LIFECYCLE.PLAYING,
        solverId: DEFAULT_SOLVER_ID,
        status: "cancelled",
      });
      setAutosolveStatus("idle");
    }
  }, [activeScreen, isAutosolving, cancelAutosolve, dispatch]);

  function handleTileClick(index) {
    if (isShuffling || isAutosolving || isNameCapture) {
      return;
    }

    if (autosolveStatus !== "idle") {
      setAutosolveStatus("idle");
    }

    shouldAnimateTiles.current = true;
    dispatch({ type: "MOVE_TILE", index, size: BOARD_SIZE, source: "player" });
  }

  async function handleShuffle() {
    if (isShuffling) {
      return;
    }

    if (isAutosolving) {
      cancelAutosolve();
      dispatch({
        type: "AUTOSOLVE_STOP",
        nextLifecycle: GAME_LIFECYCLE.PLAYING,
        solverId: DEFAULT_SOLVER_ID,
        status: "cancelled",
      });
    }

    if (autosolveStatus !== "idle") {
      setAutosolveStatus("idle");
    }

    setPendingSolve(null);
    setNamePromptSolve(null);
    setNameInput("");
    setCelebrationStartedAt(null);
    setElapsedSeconds(0);
    await runShuffle();
  }

  function handleNameSubmit() {
    saveSolvedScore(namePromptSolve, nameInput);
    dispatch({
      type: "SCORE_SAVED",
      name: (nameInput || defaultPlayerName).trim() || defaultPlayerName,
      moves: namePromptSolve?.moves ?? null,
      timeSeconds: namePromptSolve?.elapsed ?? null,
    });
    dispatch({ type: "NAME_CAPTURE_END" });
    setNamePromptSolve(null);
    setNameInput("");
  }

  function handleNameCancel() {
    saveSolvedScore(namePromptSolve, defaultPlayerName);
    dispatch({
      type: "SCORE_SAVED",
      name: defaultPlayerName,
      moves: namePromptSolve?.moves ?? null,
      timeSeconds: namePromptSolve?.elapsed ?? null,
    });
    dispatch({ type: "NAME_CAPTURE_END" });
    setNamePromptSolve(null);
    setNameInput("");
  }

  function handleRobotSolve() {
    if (isShuffling || isAutosolving || isNameCapture || activeScreen !== "game") {
      return;
    }

    cancelAutosolve();
    const token = autosolveRunRef.current.token;
    dispatch({
      type: "AUTOSOLVE_START",
      solverId: DEFAULT_SOLVER_ID,
      limits: { maxNodes: 100000, maxTimeMs: 1500 },
    });
    setAutosolveStatus("running");

    setTimeout(async () => {
      if (autosolveRunRef.current.token !== token) {
        return;
      }

      const result = solveWithPlugin(
        {
          board: game.board,
          size: BOARD_SIZE,
          limits: {
            maxNodes: 100000,
            maxTimeMs: 1500,
          },
        },
        { solverId: DEFAULT_SOLVER_ID }
      );
      if (autosolveRunRef.current.token !== token) {
        return;
      }

      if (result.status === "solved") {
        dispatch({
          type: "AUTOSOLVE_STOP",
          nextLifecycle: GAME_LIFECYCLE.SOLVED,
          solverId: DEFAULT_SOLVER_ID,
          status: result.status,
          elapsedMs: result.elapsedMs,
        });
        setAutosolveStatus("done");
        return;
      }

      if (result.status !== "found" || !result.moves || result.moves.length === 0) {
        dispatch({
          type: "AUTOSOLVE_STOP",
          nextLifecycle: GAME_LIFECYCLE.PLAYING,
          solverId: DEFAULT_SOLVER_ID,
          status: result.status,
          elapsedMs: result.elapsedMs,
        });
        setAutosolveStatus("error");
        return;
      }

      for (let step = 0; step < result.moves.length; step += 1) {
        const moveIndex = result.moves[step];
        if (autosolveRunRef.current.token !== token) {
          return;
        }

        shouldAnimateTiles.current = true;
        dispatch({
          type: "MOVE_TILE",
          index: moveIndex,
          size: BOARD_SIZE,
          source: "solve",
          step: step + 1,
        });
        const stillCurrent = await waitForAutosolveStep(token);
        if (!stillCurrent) {
          return;
        }
      }

      if (autosolveRunRef.current.token !== token) {
        return;
      }

      dispatch({
        type: "AUTOSOLVE_STOP",
        nextLifecycle: GAME_LIFECYCLE.SOLVED,
        solverId: DEFAULT_SOLVER_ID,
        status: result.status,
        elapsedMs: result.elapsedMs,
      });
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
        isShuffling={isShuffling}
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
            isShuffling={isShuffling}
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
      <NameModal
        open={Boolean(namePromptSolve)}
        value={nameInput}
        onChange={setNameInput}
        onSubmit={handleNameSubmit}
        onCancel={handleNameCancel}
      />
    </div>
  );
}
