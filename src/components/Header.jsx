import React from "react";

export function Header({
  solved,
  isShuffling,
  isAutosolving,
  autosolveStatus,
  activeScreen,
  onShowGame,
  onShowHighscores,
  onShuffle,
  onRobotSolve,
}) {
  const robotStateLabel = {
    idle: "Robot idle",
    running: "Robot running",
    done: "Robot done",
    error: "Robot error",
  }[autosolveStatus] ?? "Robot idle";

  return (
    <header className="header">
      <div>
        <p className="eyebrow">Classic sliding puzzle</p>
        <h1>Fifteen</h1>
        <p className="subhead">Slide tiles into order by using the empty space.</p>
        <p className={`status ${solved ? "status--solved" : ""}`}>
          {solved ? "Solved!" : "In progress"}
        </p>
        <p className={`status status--robot status--robot-${autosolveStatus}`}>
          {robotStateLabel}
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
            disabled={isAutosolving}
          >
            Game
          </button>
          <button
            className={`view-switch__btn ${activeScreen === "highscores" ? "is-active" : ""}`}
            type="button"
            onClick={onShowHighscores}
            role="tab"
            aria-selected={activeScreen === "highscores"}
            disabled={isAutosolving}
          >
            Highscores
          </button>
        </div>
        <button
          className="primary"
          type="button"
          onClick={onRobotSolve}
          disabled={isShuffling || isAutosolving || activeScreen !== "game"}
        >
          {isAutosolving ? "Robot..." : "Robot"}
        </button>
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
