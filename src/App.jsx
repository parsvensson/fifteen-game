import React from "react";
import {
  createSolvedBoard,
  applyMove,
  getMovableIndices,
  isSolved,
  loadHighscores,
  saveHighscores,
  shuffleBoard,
  updateHighscores,
} from "./game.js";

const size = 4;

export default function App() {
  const [game, setGame] = React.useState(() => ({
    board: createSolvedBoard(size),
    moves: 0,
  }));
  const [isShuffling, setIsShuffling] = React.useState(false);
  const [highscores, setHighscores] = React.useState(() => loadHighscores());
  const movable = getMovableIndices(game.board, size);
  const solved = isSolved(game.board, size);
  const celebrate = solved && game.moves > 0 && !isShuffling;
  const previousSolved = React.useRef(solved);

  React.useEffect(() => {
    if (solved && !previousSolved.current && game.moves > 0) {
      setHighscores((prev) => {
        const updated = updateHighscores(prev, game.moves, 5);
        saveHighscores(updated);
        return updated;
      });
    }

    previousSolved.current = solved;
  }, [solved, game.moves]);

  function handleTileClick(index) {
    if (isShuffling) {
      return;
    }

    const nextGame = applyMove(game, index, size);
    if (nextGame.moved) {
      setGame({ board: nextGame.board, moves: nextGame.moves });
    }
  }

  async function handleShuffle() {
    if (isShuffling) {
      return;
    }

    setIsShuffling(true);
    let nextBoard = game.board;

    for (let step = 0; step < 50; step += 1) {
      nextBoard = shuffleBoard(nextBoard, 1, size);
      setGame({ board: nextBoard, moves: 0 });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    setIsShuffling(false);
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
          disabled={isShuffling}
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
              onClick={() => handleTileClick(index)}
              disabled={!isMovable || isShuffling}
            >
              {value}
            </button>
          );
        })}
      </main>

      {celebrate ? (
        <div className="fireworks" data-testid="fireworks" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={`burst-${index}`} className="burst" />
          ))}
        </div>
      ) : null}

      <footer className="footer">
        <span>Moves: {game.moves}</span>
        <span>Time: 0:00</span>
      </footer>

      <section className="highscores" aria-label="High scores">
        <div className="highscores__header">
          <h2>High scores</h2>
          <span className="highscores__subhead">Fewest moves wins</span>
        </div>
        <ol className="highscores__list">
          {highscores.length > 0 ? (
            highscores.map((score, index) => (
              <li key={`score-${score}-${index}`}>
                <span className="rank">#{index + 1}</span>
                <span className="score">{score} moves</span>
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
