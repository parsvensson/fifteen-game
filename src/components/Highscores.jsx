import React from "react";

export function Highscores({ highscores }) {
  return (
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
  );
}
