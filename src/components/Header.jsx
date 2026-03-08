import React from "react";

export function Header({
  solved,
  isShuffling,
  activeScreen,
  onShowGame,
  onShowHighscores,
  onShuffle,
}) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Classic sliding puzzle</p>
        <h1>Fifteen</h1>
        <p className="subhead">Slide tiles into order by using the empty space.</p>
        <p className={`status ${solved ? "status--solved" : ""}`}>
          {solved ? "Solved!" : "In progress"}
        </p>
      </div>
      <div className="header__actions">
        <div className="view-switch" role="tablist" aria-label="Screens">
          <button
            className={`view-switch__btn ${activeScreen === "game" ? "is-active" : ""}`}
            type="button"
            onClick={onShowGame}
            role="tab"
            aria-selected={activeScreen === "game"}
          >
            Game
          </button>
          <button
            className={`view-switch__btn ${activeScreen === "highscores" ? "is-active" : ""}`}
            type="button"
            onClick={onShowHighscores}
            role="tab"
            aria-selected={activeScreen === "highscores"}
          >
            Highscores
          </button>
        </div>
        <button
          className="primary"
          type="button"
          onClick={onShuffle}
          disabled={isShuffling || activeScreen !== "game"}
        >
          Shuffle
        </button>
      </div>
    </header>
  );
}
