import type { Player, GameState } from "../../types";

interface GameHeaderProps {
  gameState: GameState;
  currentPlayer: Player;
  opponent: Player;
  isMyTurn: boolean;
  theaterLabel: string;
}

export function GameHeader({
  gameState,
  currentPlayer,
  opponent,
  isMyTurn,
  theaterLabel,
}: GameHeaderProps) {
  return (
    <div className="px-3 pt-2 pb-1">
      <div className="container-fluid">
        <div className="row bg-dark bg-opacity-75 rounded-3 px-3 py-2 align-items-center g-2">
          <div className="col text-white">
            <div className="fw-semibold fs-6 text-uppercase text-secondary mb-1">
              Opponent
            </div>
            <div className="fw-bold fs-5">Player: {opponent.name}</div>
            <small className="text-secondary">
              {opponent.score} VP · {opponent.hand.length} cards
            </small>
          </div>
          <div className="col text-center">
            <small className="text-secondary text-uppercase d-block mb-1">
              Battle {gameState.battleNumber}
            </small>
            <div className="fw-bold fs-5 text-info">{theaterLabel}</div>
            {gameState.phase === "playing" && (
              <div>
                {isMyTurn ? (
                  <span className="badge bg-success">YOUR TURN</span>
                ) : (
                  <span className="badge bg-secondary">
                    {opponent.name}'s Turn
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="col text-end text-white">
            <div className="fw-semibold fs-6 text-uppercase text-secondary mb-1">
              You
            </div>
            <div className="fw-bold fs-5">Player: {currentPlayer.name}</div>
            <small className="text-secondary">
              {currentPlayer.score} VP · {currentPlayer.hand.length} cards
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
