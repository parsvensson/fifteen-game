import React from "react";

export function FireworksLayer({ celebrate, fireworksContainerRef }) {
  if (!celebrate) {
    return null;
  }

  return (
    <div
      ref={fireworksContainerRef}
      className="fireworks"
      data-testid="fireworks"
      aria-hidden="true"
    />
  );
}
