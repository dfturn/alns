import type { DragEvent, ReactNode } from "react";
import type { GameState } from "../../types";
import type { DropTarget } from "../../hooks";
import { PlayerBadge } from "./PlayerBadge";

interface SidePanelProps {
  gameState: GameState;
  playerId: string;
  isMyTurn: boolean;
  isLoading: boolean;
  deckDropAllowed: boolean;
  deckDropActive: boolean;
  trashDropAllowed: boolean;
  trashDropActive: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDrawCard: () => void;
  actionButtons: ReactNode;
}

export function SidePanel({
  gameState,
  playerId,
  isMyTurn,
  isLoading,
  deckDropAllowed,
  deckDropActive,
  trashDropAllowed,
  trashDropActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onDrawCard,
  actionButtons,
}: SidePanelProps) {
  const isCurrentPlayerFirst = playerId === gameState.player1.id;
  const bottomBadgeType: "first" | "second" = isCurrentPlayerFirst
    ? "first"
    : "second";
  const topBadgeType: "first" | "second" = isCurrentPlayerFirst
    ? "second"
    : "first";

  return (
    <div className="board-side">
      <div className="side-panel bg-dark bg-opacity-75 rounded-3 p-3 h-100 d-flex flex-column">
        {/* Top section: opponent badge centered vertically */}
        <div className="flex-grow-1 d-flex flex-column justify-content-center">
          <PlayerBadge type={topBadgeType} position="top" />
        </div>

        {/* Center section: deck and trash */}
        <div className="d-flex flex-column justify-content-center gap-4 py-3">
          <div
            className={[
              "drop-zone",
              "deck-drop-zone",
              deckDropAllowed ? "drop-allowed" : "",
              deckDropActive ? "drop-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-drop-target="deck"
            onDragOver={(event) => onDragOver(event, "deck")}
            onDragLeave={(event) => onDragLeave(event, "deck")}
            onDrop={(event) => onDrop(event, "deck")}
          >
            <div className="side-title">Deck</div>
            <div className="side-count">
              {gameState.deck.length} cards remaining
            </div>
            {gameState.phase === "playing" &&
              isMyTurn &&
              gameState.deck.length > 0 && (
                <button
                  className="btn btn-sm btn-outline-light mt-3"
                  onClick={onDrawCard}
                  disabled={isLoading}
                >
                  Draw Top Card
                </button>
              )}
          </div>

          <div
            className={[
              "drop-zone",
              "trash-drop-zone",
              trashDropAllowed ? "drop-allowed" : "",
              trashDropActive ? "drop-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-drop-target="trash"
            onDragOver={(event) => onDragOver(event, "trash")}
            onDragLeave={(event) => onDragLeave(event, "trash")}
            onDrop={(event) => onDrop(event, "trash")}
          >
            <div className="side-title">Trash</div>
            <div className="side-count">
              {gameState.trash.length} cards destroyed
            </div>
            <div className="side-hint">Drop a card here to destroy it.</div>
          </div>
        </div>

        {/* Bottom section: player badge centered vertically */}
        <div className="flex-grow-1 d-flex flex-column justify-content-center">
          <PlayerBadge
            type={bottomBadgeType}
            position="bottom"
            actions={actionButtons}
          />
        </div>
      </div>
    </div>
  );
}
