import React from "react";

export function NameModal({
  open,
  value,
  onChange,
  onSubmit,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-modal-title"
      >
        <h2 id="winner-modal-title">You solved it!</h2>
        <p className="modal__text">Enter your name for highscores.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="modal__label" htmlFor="winner-name">
            Name
          </label>
          <input
            id="winner-name"
            className="modal__input"
            type="text"
            maxLength={30}
            value={value}
            autoFocus
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }
            }}
          />
          <div className="modal__actions">
            <button className="secondary" type="button" onClick={onCancel}>
              Skip
            </button>
            <button className="primary" type="submit">
              Save score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
