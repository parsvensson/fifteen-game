import React from "react";

export function Header({ solved, isShuffling, onShuffle }) {
  return (
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
        onClick={onShuffle}
        disabled={isShuffling}
      >
        Shuffle
      </button>
    </header>
  );
}
