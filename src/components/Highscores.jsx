import React from "react";
import { formatElapsed } from "../time.js";

function formatSolvedAt(solvedAt) {
  if (!solvedAt) {
    return "Unknown date";
  }

  const parsed = new Date(solvedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function Highscores({ highscores, onReset }) {
  return (
    <section className="highscores-screen screen-fade-in" aria-label="High scores">
      <div className="highscores__header">
        <h2>High scores</h2>
        <div className="highscores__actions">
          <span className="highscores__subhead">Sorted by fewest moves</span>
          <button
            className="secondary"
            type="button"
            onClick={onReset}
            disabled={highscores.length === 0}
          >
            Reset
          </button>
        </div>
      </div>
      <ol className="highscores__list">
        {highscores.length > 0 ? (
          highscores.map((score, index) => (
            <li
              key={`score-${score.name}-${score.moves}-${score.timeSeconds}-${index}`}
            >
              <span className="rank">#{index + 1}</span>
              <span className="player">{score.name}</span>
              <span className="score score--meta">
                <span>{score.moves} moves · {formatElapsed(score.timeSeconds ?? 0)}</span>
                <span className="score__date">{formatSolvedAt(score.solvedAt)}</span>
              </span>
            </li>
          ))
        ) : (
          <li className="empty">No scores yet</li>
        )}
      </ol>
    </section>
  );
}
