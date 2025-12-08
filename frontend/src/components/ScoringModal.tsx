import { useState } from "react";
import type { GameState, TheaterType } from "../types";

interface ScoringModalProps {
  gameState: GameState;
  playerId: string;
  onSubmit: (scores: Record<TheaterType, number>) => void;
  onNextBattle: () => void;
  isLoading: boolean;
  nextBattleLabel?: string;
}

export default function ScoringModal({
  gameState,
  playerId,
  onSubmit,
  onNextBattle,
  isLoading,
  nextBattleLabel,
}: ScoringModalProps) {
  const [airScore, setAirScore] = useState(0);
  const [landScore, setLandScore] = useState(0);
  const [seaScore, setSeaScore] = useState(0);

  const hasSubmittedScores = () => {
    if (!gameState.theaterScores) return false;
    const isPlayer1 = gameState.player1.id === playerId;
    return (
      gameState.theaterScores.air &&
      (isPlayer1
        ? gameState.theaterScores.air.player1Total > 0
        : gameState.theaterScores.air.player2Total > 0)
    );
  };

  const allScoresSubmitted = () => {
    if (!gameState.theaterScores) return false;
    const { air, land, sea } = gameState.theaterScores;
    return (
      air &&
      land &&
      sea &&
      air.player1Total > 0 &&
      air.player2Total > 0 &&
      land.player1Total > 0 &&
      land.player2Total > 0 &&
      sea.player1Total > 0 &&
      sea.player2Total > 0
    );
  };

  const handleSubmit = () => {
    const scores: Record<TheaterType, number> = {
      air: airScore,
      land: landScore,
      sea: seaScore,
    };
    onSubmit(scores);
  };

  const getBattleWinner = () => {
    if (!gameState.theaterScores || !allScoresSubmitted()) return null;
    let player1Wins = 0;
    let player2Wins = 0;
    const theaters: TheaterType[] = ["air", "land", "sea"];
    theaters.forEach((theater) => {
      const score = gameState.theaterScores![theater];
      if (score.player1Total > score.player2Total) player1Wins++;
      else if (score.player2Total > score.player1Total) player2Wins++;
    });
    if (player1Wins >= 2) return gameState.player1;
    if (player2Wins >= 2) return gameState.player2;
    return null;
  };

  const battleWinner = getBattleWinner();
  const didIWin = battleWinner?.id === playerId;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", zIndex: 1050 }}
    >
      <div
        className="card"
        style={{ maxWidth: "600px", width: "100%", margin: "1rem" }}
      >
        <div className="card-body p-4">
          <h2 className="card-title text-center mb-4">Battle Complete!</h2>

          {!hasSubmittedScores() ? (
            <div>
              <p className="text-center text-muted mb-4">
                Calculate your total strength in each theater and enter the
                values below:
              </p>

              <div className="mb-4">
                <div className="mb-3">
                  <label className="form-label">Air Theater Strength</label>
                  <input
                    type="number"
                    min="0"
                    value={airScore}
                    onChange={(e) => setAirScore(parseInt(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Land Theater Strength</label>
                  <input
                    type="number"
                    min="0"
                    value={landScore}
                    onChange={(e) =>
                      setLandScore(parseInt(e.target.value) || 0)
                    }
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Sea Theater Strength</label>
                  <input
                    type="number"
                    min="0"
                    value={seaScore}
                    onChange={(e) => setSeaScore(parseInt(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary w-100 py-2"
              >
                {isLoading ? "Submitting..." : "Submit Scores"}
              </button>
            </div>
          ) : allScoresSubmitted() ? (
            <div>
              <h3 className="text-center mb-3">Battle Results</h3>

              <div className="mb-4">
                {(["air", "land", "sea"] as TheaterType[]).map((theater) => {
                  const score = gameState.theaterScores![theater];
                  return (
                    <div
                      key={theater}
                      className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-2"
                    >
                      <span className="fw-medium text-capitalize">
                        {theater}:
                      </span>
                      <span>
                        {gameState.player1.name}: {score.player1Total} vs{" "}
                        {gameState.player2.name}: {score.player2Total}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-center fs-4 fw-bold mb-3">
                {battleWinner ? (
                  <span className={didIWin ? "text-success" : "text-danger"}>
                    {didIWin
                      ? "You Win! +6 VP"
                      : `${battleWinner.name} Wins! +6 VP`}
                  </span>
                ) : (
                  <span className="text-secondary">Tie - No VP Awarded</span>
                )}
              </div>

              <div className="text-center mb-4">
                <div>
                  {gameState.player1.name}: {gameState.player1.score} VP
                </div>
                <div>
                  {gameState.player2.name}: {gameState.player2.score} VP
                </div>
              </div>

              {gameState.player1.score < 12 && gameState.player2.score < 12 && (
                <button
                  onClick={onNextBattle}
                  disabled={isLoading}
                  className="btn btn-success w-100 py-2"
                >
                  {isLoading ? "Starting..." : "Start Next Battle"}
                </button>
              )}
              {nextBattleLabel && (
                <p className="text-center text-muted small mt-3 mb-0">
                  Next battle theaters: {nextBattleLabel}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div
                className="spinner-border text-primary mb-3"
                style={{ width: "3rem", height: "3rem" }}
              />
              <p className="text-muted">
                Waiting for opponent to submit scores...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
