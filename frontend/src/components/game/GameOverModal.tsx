import type { Player } from "../../types";

interface GameOverModalProps {
  currentPlayer: Player;
  opponent: Player;
  isLoading: boolean;
  onStartNextGame: () => void;
}

export function GameOverModal({
  currentPlayer,
  opponent,
  isLoading,
  onStartNextGame,
}: GameOverModalProps) {
  const didWin = currentPlayer.score >= 12;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", zIndex: 1050 }}
    >
      <div
        className="card bg-dark text-white border-warning"
        style={{ maxWidth: "400px" }}
      >
        <div className="card-body text-center p-4">
          <h2 className="card-title text-warning mb-4">Game Over!</h2>
          <div className="bg-secondary rounded p-3 mb-2">
            {currentPlayer.name}:{" "}
            <span className="fw-bold text-warning">
              {currentPlayer.score} VP
            </span>
          </div>
          <div className="bg-secondary rounded p-3 mb-4">
            {opponent.name}:{" "}
            <span className="fw-bold text-info">{opponent.score} VP</span>
          </div>
          <div className="fs-3 fw-bold">
            {didWin ? (
              <span className="text-success">🎉 You Win! 🎉</span>
            ) : (
              <span className="text-danger">You Lose</span>
            )}
          </div>
          <div className="mt-4 d-grid">
            <button
              className="btn btn-warning btn-lg fw-semibold"
              onClick={onStartNextGame}
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Next Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
