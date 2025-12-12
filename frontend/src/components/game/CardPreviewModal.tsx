import type { Card } from "../../types";
import CardComponent from "../Card";

interface CardPreviewModalProps {
  card: Card;
  faceUp: boolean;
  onClose: () => void;
}

export function CardPreviewModal({
  card,
  faceUp,
  onClose,
}: CardPreviewModalProps) {
  return (
    <div
      className="card-preview-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card-preview-content"
        onClick={(event) => event.stopPropagation()}
      >
        <CardComponent
          card={card}
          faceUp={faceUp}
          style={{
            // Use height-based constraint so card fits vertically on screen
            height: "min(70vh, 320px)",
            width: "calc(min(70vh, 320px) / 1.4)",
            cursor: "default",
          }}
        />
        <button
          className="btn btn-outline-light"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
