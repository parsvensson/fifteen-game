import React from "react";
import {
  createGameState,
  gameReducer,
  getMovableIndices,
  isSolved,
  loadHighscores,
  saveHighscores,
  updateHighscores,
} from "./game.js";

const size = 4;
const defaultPlayerName = "Anonymous";

function formatElapsed(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function App() {
  const [game, dispatch] = React.useReducer(gameReducer, size, createGameState);
  const [highscores, setHighscores] = React.useState(() => loadHighscores());
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const movable = getMovableIndices(game.board, size);
  const solved = isSolved(game.board, size);
  const celebrate = solved && game.moves > 0 && !game.isShuffling;
  const timerRunning = game.moves > 0 && !solved && !game.isShuffling;
  const previousSolved = React.useRef(solved);
  const tileRefs = React.useRef(new Map());
  const previousTileRects = React.useRef(new Map());
  const shouldAnimateTiles = React.useRef(false);
  const fireworksContainerRef = React.useRef(null);

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
    if (solved && !previousSolved.current && game.moves > 0) {
      const name = getPlayerName();
      setHighscores((prev) => {
        const updated = updateHighscores(prev, game.moves, name, 5);
        saveHighscores(updated);
        return updated;
      });
    }

    previousSolved.current = solved;
  }, [solved, game.moves]);

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
        node.style.transition = "transform 180ms ease";
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
      }, 1600);
    }

    startCelebration();

    return () => {
      disposed = true;
      clearTimeout(stopTimer);
      fireworks?.stop();
      fireworks?.clear();
    };
  }, [celebrate]);

  function handleTileClick(index) {
    if (game.isShuffling) {
      return;
    }

    shouldAnimateTiles.current = true;
    dispatch({ type: "MOVE_TILE", index, size });
  }

  async function handleShuffle() {
    if (game.isShuffling) {
      return;
    }

    dispatch({ type: "SHUFFLE_START" });
    setElapsedSeconds(0);

    for (let step = 0; step < 50; step += 1) {
      dispatch({ type: "SHUFFLE_STEP", size });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    dispatch({ type: "SHUFFLE_END" });
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Classic sliding puzzle</p>
          <h1>Fifteen</h1>
          <p className="subhead">
            Arrange the tiles in order by sliding into the empty space.
          </p>
          <p className="instructions">
            Click a tile next to the empty space to slide it.
          </p>
          <p className={`status ${solved ? "status--solved" : ""}`}>
            {solved ? "Solved!" : "In progress"}
          </p>
        </div>
        <button
          className="primary"
          type="button"
          onClick={handleShuffle}
          disabled={game.isShuffling}
        >
          Shuffle
        </button>
      </header>

      <main className="board" aria-label="15 puzzle grid">
        {game.board.map((value, index) => {
          if (value === 0) {
            return (
              <div
                key={`empty-${index}`}
                className="tile empty"
                aria-hidden="true"
              />
            );
          }

          const isMovable = movable.includes(index);

          return (
            <button
              key={value}
              className={`tile ${isMovable ? "movable" : ""}`}
              type="button"
              ref={(node) => {
                if (node) {
                  tileRefs.current.set(value, node);
                } else {
                  tileRefs.current.delete(value);
                }
              }}
              onClick={() => handleTileClick(index)}
              disabled={!isMovable || game.isShuffling}
            >
              {value}
            </button>
          );
        })}
      </main>

      {celebrate ? (
        <div
          ref={fireworksContainerRef}
          className="fireworks"
          data-testid="fireworks"
          aria-hidden="true"
        />
      ) : null}

      <footer className="footer">
        <span>Moves: {game.moves}</span>
        <span>Time: {formatElapsed(elapsedSeconds)}</span>
      </footer>

      <section className="highscores" aria-label="High scores">
        <div className="highscores__header">
          <h2>High scores</h2>
          <span className="highscores__subhead">Fewest moves wins</span>
        </div>
        <ol className="highscores__list">
          {highscores.length > 0 ? (
            highscores.map((score, index) => (
              <li key={`score-${score.name}-${score.moves}-${index}`}>
                <span className="rank">#{index + 1}</span>
                <span className="player">{score.name}</span>
                <span className="score">{score.moves} moves</span>
              </li>
            ))
          ) : (
            <li className="empty">No scores yet</li>
          )}
        </ol>
      </section>
    </div>
  );
}
