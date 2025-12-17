import type { DragEvent } from "react";
import type {
  Card,
  Player,
  PlayedCard,
  TheaterScore,
  TheaterType,
} from "../../types";
import type { DropTarget } from "../../hooks";
import CardComponent from "../Card";
import TheaterComponent from "../Theater";

const DEFAULT_THEATER_ORDER: TheaterType[] = ["air", "land", "sea"];

const formatTheaterName = (theater: TheaterType) =>
  theater.charAt(0).toUpperCase() + theater.slice(1);

interface TheaterGridProps {
  theaterOrder: TheaterType[];
  preferredTheater: TheaterType | null;
  isScoringPhase: boolean;
  playerSubmitted: boolean;
  isLoading: boolean;
  isMyTurn: boolean;
  playerId: string;
  opponentName: string;
  theaterScores: Partial<Record<TheaterType, TheaterScore>> | null;
  isPlayer1: boolean;
  scoreInputs: Record<TheaterType, string>;
  theaters: Record<TheaterType, { cards: PlayedCard[] }>;
  getPlayerCardsInTheater: (
    theater: TheaterType,
    isOpponent: boolean
  ) => PlayedCard[];
  canDropOnTarget: (target: DropTarget) => boolean;
  activeDropTarget: DropTarget | null;
  onDragOver: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onTheaterCardDragStart: (
    theater: TheaterType,
    playedCard: PlayedCard
  ) => void;
  onTheaterCardDragEnd: () => void;
  onTheaterCardClick: (theater: TheaterType, playedCard: PlayedCard) => void;
  onCardPreview: (card: Card, faceUp: boolean) => void;
  onScoreInputChange: (theater: TheaterType, value: string) => void;
}

export function TheaterGrid({
  theaterOrder,
  preferredTheater,
  isScoringPhase,
  playerSubmitted,
  isLoading,
  isMyTurn,
  opponentName,
  theaterScores,
  isPlayer1,
  scoreInputs,
  getPlayerCardsInTheater,
  canDropOnTarget,
  activeDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onTheaterCardDragStart,
  onTheaterCardDragEnd,
  onTheaterCardClick,
  onCardPreview,
  onScoreInputChange,
}: TheaterGridProps) {
  const getRecordedScore = (theater: TheaterType, forSelf: boolean) => {
    const record = theaterScores?.[theater];
    if (!record) return 0;
    if (forSelf) {
      return isPlayer1 ? record.player1Total : record.player2Total;
    }
    return isPlayer1 ? record.player2Total : record.player1Total;
  };

  // Calculate max card counts across all theaters for consistent stack heights
  const maxOpponentCards = Math.max(
    ...theaterOrder.map((t) => getPlayerCardsInTheater(t, true).length)
  );
  const maxPlayerCards = Math.max(
    ...theaterOrder.map((t) => getPlayerCardsInTheater(t, false).length)
  );

  return (
    <div className="theater-grid">
      {theaterOrder.map((theater) => (
        <div key={theater} className="theater-column d-flex">
          <div
            className="theater-slot flex-grow-1 d-flex flex-column align-items-stretch"
            data-drop-target={theater}
            onDragOver={(event) => onDragOver(event, theater)}
            onDragLeave={(event) => onDragLeave(event, theater)}
            onDrop={(event) => onDrop(event, theater)}
          >
            <div className="theater-stage flex-shrink-0">
              <TheaterComponent
                type={theater}
                opponentCards={getPlayerCardsInTheater(theater, true)}
                playerCards={getPlayerCardsInTheater(theater, false)}
                maxOpponentCards={maxOpponentCards}
                maxPlayerCards={maxPlayerCards}
                isDropAllowed={canDropOnTarget(theater)}
                isDropActive={activeDropTarget === theater}
                isPreferred={preferredTheater === theater}
                onPlayerCardClick={
                  isMyTurn
                    ? (playedCard: PlayedCard) =>
                        onTheaterCardClick(theater, playedCard)
                    : undefined
                }
                onPlayerCardDragStart={(playedCard: PlayedCard) =>
                  onTheaterCardDragStart(theater, playedCard)
                }
                onPlayerCardDragEnd={onTheaterCardDragEnd}
                onPlayerCardLongPress={(playedCard: PlayedCard) =>
                  onCardPreview(playedCard.card, playedCard.faceUp)
                }
                onOpponentCardLongPress={(playedCard: PlayedCard) =>
                  onCardPreview(playedCard.card, playedCard.faceUp)
                }
                onOpponentCardClick={
                  isMyTurn
                    ? (playedCard: PlayedCard) =>
                        onTheaterCardClick(theater, playedCard)
                    : undefined
                }
                onOpponentCardDragStart={(playedCard: PlayedCard) =>
                  onTheaterCardDragStart(theater, playedCard)
                }
                onOpponentCardDragEnd={onTheaterCardDragEnd}
              />
            </div>
            {isScoringPhase && (
              <div className="theater-score-card mt-3">
                <div className="theater-score-line text-uppercase text-secondary">
                  {opponentName}
                </div>
                <div className="theater-score-value">
                  {getRecordedScore(theater, false) > 0
                    ? getRecordedScore(theater, false)
                    : "—"}
                </div>
                {playerSubmitted ? (
                  <>
                    <div className="theater-score-line text-uppercase text-secondary mt-2">
                      You
                    </div>
                    <div className="theater-score-value">
                      {getRecordedScore(theater, true)}
                    </div>
                  </>
                ) : (
                  <div className="theater-score-input mt-2">
                    <label
                      htmlFor={`score-${theater}`}
                      className="form-label form-label-sm text-secondary"
                    >
                      Your score
                    </label>
                    <input
                      id={`score-${theater}`}
                      type="number"
                      min="0"
                      className="form-control form-control-sm"
                      value={scoreInputs[theater] ?? ""}
                      onChange={(event) =>
                        onScoreInputChange(theater, event.target.value)
                      }
                      disabled={isLoading}
                      inputMode="numeric"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ScoringActionsPanelProps {
  playerSubmitted: boolean;
  opponentSubmitted: boolean;
  allScoresEntered: boolean;
  isLoading: boolean;
  showStartNextBattle: boolean;
  nextBattleLabel: string;
  onSubmitScores: () => void;
  onStartNextBattle: () => void;
}

export function ScoringActionsPanel({
  playerSubmitted,
  opponentSubmitted,
  allScoresEntered,
  isLoading,
  showStartNextBattle,
  nextBattleLabel,
  onSubmitScores,
  onStartNextBattle,
}: ScoringActionsPanelProps) {
  const bothSubmitted = playerSubmitted && opponentSubmitted;

  return (
    <div className="scoring-actions-panel bg-dark bg-opacity-50 rounded-3 p-3">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
        <div className="flex-grow-1">
          {playerSubmitted ? (
            <div className="alert alert-success mb-0 py-2">
              Your scores are submitted.
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onSubmitScores}
              disabled={!allScoresEntered || isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Scores"}
            </button>
          )}
        </div>
        <div className="text-secondary small flex-grow-1">
          {playerSubmitted
            ? opponentSubmitted
              ? "Both players have submitted totals."
              : "Waiting for opponent to submit totals."
            : "Enter the total strength for each theater, then submit."}
        </div>
        {showStartNextBattle && bothSubmitted && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-success"
              onClick={onStartNextBattle}
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Start Next Battle"}
            </button>
            <div className="text-info small align-self-center">
              Next: {nextBattleLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScoringResultsPanelProps {
  theaterOrder: TheaterType[];
  theaterScores: Partial<Record<TheaterType, TheaterScore>> | null;
  player1: Player;
  player2: Player;
  playerId: string;
  nextBattleLabel: string;
}

export function ScoringResultsPanel({
  theaterOrder,
  theaterScores,
  player1,
  player2,
  playerId,
  nextBattleLabel,
}: ScoringResultsPanelProps) {
  const battleWinner = (() => {
    if (!theaterScores) return null;

    let player1Wins = 0;
    let player2Wins = 0;
    (DEFAULT_THEATER_ORDER as TheaterType[]).forEach((theater) => {
      const scores = theaterScores[theater];
      if (!scores) return;
      if (scores.player1Total > scores.player2Total) {
        player1Wins++;
      } else if (scores.player2Total > scores.player1Total) {
        player2Wins++;
      }
    });

    if (player1Wins >= 2) return player1;
    if (player2Wins >= 2) return player2;
    return null;
  })();

  const didIWin = battleWinner?.id === playerId;

  return (
    <div className="scoring-results-panel bg-dark bg-opacity-25 rounded-3 p-3">
      <div className="text-uppercase text-secondary text-center small fw-semibold">
        Battle Results
      </div>
      <div className="row g-2 mt-2">
        {theaterOrder.map((theater) => {
          const scores = theaterScores?.[theater];
          return (
            <div key={`result-${theater}`} className="col-12 col-md-4">
              <div className="scoring-result-tile">
                <div className="scoring-result-label">
                  {formatTheaterName(theater)}
                </div>
                <div className="scoring-result-values">
                  <span>
                    {player1.name}: {scores?.player1Total ?? 0}
                  </span>
                  <span>
                    {player2.name}: {scores?.player2Total ?? 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center fs-5 mt-3">
        {battleWinner ? (
          <span className={didIWin ? "text-success" : "text-danger"}>
            {didIWin
              ? "You win the battle! +6 VP"
              : `${battleWinner.name} wins the battle.`}
          </span>
        ) : (
          <span className="text-warning">Tie - No VP awarded</span>
        )}
      </div>
      <div className="text-center text-secondary mt-2">
        {player1.name}: {player1.score} VP · {player2.name}: {player2.score} VP
      </div>
      <div className="text-center text-info small mt-2">
        Next battle theaters: {nextBattleLabel}
      </div>
    </div>
  );
}

interface OpponentHandProps {
  cardCount: number;
}

export function OpponentHand({ cardCount }: OpponentHandProps) {
  return (
    <div className="d-flex justify-content-center flex-wrap gap-2 opponent-hand">
      {Array.from({ length: cardCount }).map((_, index) => (
        <CardComponent
          key={`opponent-card-${index}`}
          card={null}
          faceUp={false}
          rotated
          className="shadow-sm"
          onClick={undefined}
          style={{ width: "56px", height: "84px" }}
        />
      ))}
    </div>
  );
}

interface PlayerHandProps {
  cards: Card[];
  canDrag: boolean;
  dropAllowed: boolean;
  dropActive: boolean;
  getCardFaceUp: (cardId: number) => boolean;
  onCardClick: (card: Card) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, card: Card) => void;
  onTouchDragStart: (card: Card) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, target: DropTarget) => void;
  onCardLongPress: (card: Card) => void;
}

export function PlayerHand({
  cards,
  canDrag,
  dropAllowed,
  dropActive,
  getCardFaceUp,
  onCardClick,
  onDragStart,
  onTouchDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardLongPress,
}: PlayerHandProps) {
  return (
    <div
      className={[
        "drop-zone",
        "hand-drop-zone",
        "player-hand-container",
        dropAllowed ? "drop-allowed" : "",
        dropActive ? "drop-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-drop-target="hand"
      onDragOver={(event) => onDragOver(event, "hand")}
      onDragLeave={(event) => onDragLeave(event, "hand")}
      onDrop={(event) => onDrop(event, "hand")}
    >
      <div className="player-hand-cards">
        {cards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            faceUp={getCardFaceUp(card.id)}
            onClick={() => onCardClick(card)}
            draggable={canDrag}
            onDragStart={(event) => onDragStart(event, card)}
            onTouchDragStart={
              canDrag ? () => onTouchDragStart(card) : undefined
            }
            onTouchDragEnd={onDragEnd}
            onDragEnd={onDragEnd}
            onDoubleTap={() => onCardLongPress(card)}
            className="player-hand-card"
            style={{
              cursor: canDrag ? "grab" : "pointer",
              userSelect: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
