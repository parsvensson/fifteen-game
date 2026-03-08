import React from "react";

export function ScoreStrip({ moves, elapsed }) {
  return (
    <section className="score-strip" aria-label="Game stats">
      <div className="score-strip__cell">
        <span className="score-strip__label">Moves</span>
        <span className="score-strip__value" aria-label={`Moves: ${moves}`}>
          {moves}
        </span>
      </div>
      <div className="score-strip__divider" aria-hidden="true" />
      <div className="score-strip__cell">
        <span className="score-strip__label">Time</span>
        <span className="score-strip__value" aria-label={`Time: ${elapsed}`}>
          {elapsed}
        </span>
      </div>
    </section>
  );
}
