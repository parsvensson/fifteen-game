import React from "react";

export function Board({ board, movable, isShuffling, onTileClick, setTileRef }) {
  return (
    <main className="board" aria-label="15 puzzle grid">
      {board.map((value, index) => {
        if (value === 0) {
          return <div key={`empty-${index}`} className="tile empty" aria-hidden="true" />;
        }

        const isMovable = movable.includes(index);

        return (
          <button
            key={value}
            className={`tile ${isMovable ? "movable" : ""}`}
            type="button"
            ref={setTileRef(value)}
            onClick={() => onTileClick(index)}
            disabled={!isMovable || isShuffling}
          >
            {value}
          </button>
        );
      })}
    </main>
  );
}
