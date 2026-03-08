import React from "react";

export function Footer({ moves, elapsed }) {
  return (
    <footer className="footer">
      <span>Moves: {moves}</span>
      <span>Time: {elapsed}</span>
    </footer>
  );
}
