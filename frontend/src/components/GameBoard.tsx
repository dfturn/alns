import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { apiClient } from "../api";
import type {
  Card,
  GameState,
  PlayedCard,
  TheaterScore,
  TheaterType,
} from "../types";
import CardComponent from "./Card";
import TheaterComponent from "./Theater";

interface GameBoardProps {
  gameId: string;
  playerId: string;
  roomId: string;
}

type DragContext =
  | { type: "hand"; card: Card; faceUp: boolean }
  | { type: "theater"; theater: TheaterType; playedCard: PlayedCard };

type DropTarget = TheaterType | "hand" | "deck" | "trash";

const DEFAULT_THEATER_ORDER: TheaterType[] = ["air", "land", "sea"];

const formatTheaterName = (theater: TheaterType) =>
  theater.charAt(0).toUpperCase() + theater.slice(1);

const rotateTheaterOrder = (order: TheaterType[]) => {
  if (!order.length) {
    return DEFAULT_THEATER_ORDER;
  }

  const rotated = [...order];
  const last = rotated.pop();
  if (last === undefined) {
    return rotated;
  }
  rotated.unshift(last);
  return rotated;
};

const FIRST_PLAYER_BADGE: Card = {
  id: -101,
  name: "1st player",
  theater: "air",
  strength: 0,
};

const SECOND_PLAYER_BADGE: Card = {
  id: -102,
  name: "2nd player",
  theater: "air",
  strength: 0,
};

function shallowEqualRecords(
  a: Record<number, boolean>,
  b: Record<number, boolean>
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (a[key as unknown as number] !== b[key as unknown as number]) {
      return false;
    }
  }

  return true;
}

export default function GameBoard({ gameId, playerId }: GameBoardProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [cardFaceUpMap, setCardFaceUpMap] = useState<Record<number, boolean>>(
    {}
  );
  const [dragContext, setDragContext] = useState<DragContext | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(
    null
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const autoAdvanceBattleRef = useRef<number | null>(null);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewFaceUp, setPreviewFaceUp] = useState(true);
  const [scoreInputs, setScoreInputs] = useState<Record<TheaterType, string>>({
    air: "",
    land: "",
    sea: "",
  });

  const closePreview = useCallback(() => {
    setPreviewCard(null);
    setPreviewFaceUp(true);
  }, []);

  const handleCardPreview = useCallback((card: Card, faceUp: boolean) => {
    setPreviewCard(card);
    setPreviewFaceUp(faceUp);
  }, []);

  const handleScoreInputChange = useCallback(
    (theater: TheaterType, value: string) => {
      const sanitized = value.replace(/[^0-9]/g, "");
      setScoreInputs((prev) => ({ ...prev, [theater]: sanitized }));
    },
    []
  );

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  useEffect(() => {
    if (!gameState) return;

    setCardFaceUpMap((prev) => {
      const next: Record<number, boolean> = {};
      const player =
        gameState.player1.id === playerId
          ? gameState.player1
          : gameState.player2;
      player.hand.forEach((card) => {
        next[card.id] = prev[card.id] ?? true;
      });

      return shallowEqualRecords(prev, next) ? prev : next;
    });
  }, [gameState, playerId]);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.phase !== "scoring" || gameState.withdrewPlayerId) {
      setScoreInputs({ air: "", land: "", sea: "" });
      return;
    }

    const isPlayer1 = gameState.player1.id === playerId;
    const theaterScores = (gameState.theaterScores ?? {}) as Partial<
      Record<TheaterType, TheaterScore>
    >;
    setScoreInputs((prev) => {
      let changed = false;
      const next: Record<TheaterType, string> = { ...prev };
      (DEFAULT_THEATER_ORDER as TheaterType[]).forEach((theater) => {
        const entry = theaterScores[theater];
        const recorded = entry
          ? isPlayer1
            ? entry.player1Total
            : entry.player2Total
          : 0;
        if (recorded > 0) {
          const value = String(recorded);
          if (next[theater] !== value) {
            next[theater] = value;
            changed = true;
          }
        }
      });

      if (!changed) {
        return prev;
      }
      return next;
    });
  }, [gameState, playerId]);

  useEffect(() => {
    if (!previewCard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewCard, closePreview]);

  useEffect(() => {
    if (!previewCard) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewCard]);

  const loadGame = async () => {
    try {
      const game = await apiClient.getGame(gameId);
      setGameState(game);
    } catch (err) {
      console.error("Failed to load game:", err);
    }
  };

  const isMyTurn = () => gameState?.currentPlayerId === playerId;

  const getCurrentPlayer = () => {
    if (!gameState) return null;
    return gameState.player1.id === playerId
      ? gameState.player1
      : gameState.player2;
  };

  const getOpponent = () => {
    if (!gameState) return null;
    return gameState.player1.id === playerId
      ? gameState.player2
      : gameState.player1;
  };

  const getPlayerCardsInTheater = (
    theater: TheaterType,
    isOpponent: boolean
  ): PlayedCard[] => {
    if (!gameState) return [];
    const targetPlayerId = isOpponent ? getOpponent()?.id : playerId;
    return gameState.theaters[theater].cards.filter(
      (pc) => pc.playerId === targetPlayerId
    );
  };

  const getCardFaceUp = (cardId: number) => cardFaceUpMap[cardId] ?? true;

  const handleHandCardClick = (card: Card) => {
    setCardFaceUpMap((prev) => ({
      ...prev,
      [card.id]: !(prev[card.id] ?? true),
    }));
  };

  const handleHandCardDragStart = (
    event: DragEvent<HTMLDivElement>,
    card: Card
  ) => {
    if (
      !gameState ||
      !isMyTurn() ||
      gameState.phase !== "playing" ||
      isLoading
    ) {
      event.preventDefault();
      return;
    }

    const faceUp = getCardFaceUp(card.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `hand-${card.id}`);
    setDragContext({ type: "hand", card, faceUp });
  };

  const handleTheaterCardDragStart = (
    theater: TheaterType,
    playedCard: PlayedCard
  ) => {
    if (
      !gameState ||
      !isMyTurn() ||
      gameState.phase !== "playing" ||
      isLoading ||
      playedCard.playerId !== playerId
    ) {
      return;
    }

    setDragContext({ type: "theater", theater, playedCard });
  };

  const handleDragEnd = () => {
    setDragContext(null);
    setActiveDropTarget(null);
  };

  const canDropOnTarget = (target: DropTarget): boolean => {
    if (!dragContext || !gameState || isLoading) return false;

    if (dragContext.type === "hand") {
      if (target === "hand" || target === "deck") {
        return false;
      }
      if (target === "trash") {
        return isMyTurn() && gameState.phase === "playing";
      }
      return isMyTurn() && gameState.phase === "playing";
    }

    if (dragContext.type === "theater") {
      if (!isMyTurn() || gameState.phase !== "playing") return false;
      if (dragContext.playedCard.playerId !== playerId) return false;
      return target === "hand" || target === "deck" || target === "trash";
    }

    return false;
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    target: DropTarget
  ) => {
    if (!canDropOnTarget(target)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropTarget((prev) => (prev === target ? prev : target));
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
    target: DropTarget
  ) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) {
      return;
    }
    setActiveDropTarget((prev) => (prev === target ? null : prev));
  };

  const handleDropOnTarget = async (
    event: DragEvent<HTMLDivElement>,
    target: DropTarget
  ) => {
    event.preventDefault();

    if (!dragContext || !gameState || isLoading) return;
    if (!canDropOnTarget(target)) return;

    const context = dragContext;
    setActiveDropTarget(null);

    try {
      if (target === "hand" && context.type === "theater") {
        await manipulateTopCard(context.theater, "return");
      } else if (target === "deck" && context.type === "theater") {
        await manipulateTopCard(context.theater, "flip");
      } else if (target === "trash" && context.type === "theater") {
        await manipulateTopCard(context.theater, "destroy");
      } else if (target === "trash" && context.type === "hand") {
        await destroyHandCard(context.card);
      } else if (target !== "hand" && target !== "deck" && target !== "trash") {
        if (context.type === "hand") {
          await playCardToTheater(context.card, target, context.faceUp);
        }
      }
    } finally {
      setDragContext(null);
    }
  };

  const playCardToTheater = async (
    card: Card,
    theater: TheaterType,
    faceUp: boolean
  ) => {
    if (!gameState) return;
    setIsLoading(true);
    setError("");

    try {
      const updatedGame = await apiClient.playCard(
        gameId,
        playerId,
        card.id,
        theater,
        faceUp
      );
      setGameState(updatedGame);
      setCardFaceUpMap((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to play card");
    } finally {
      setIsLoading(false);
    }
  };

  const destroyHandCard = async (card: Card) => {
    if (!gameState) return;
    setIsLoading(true);
    setError("");

    try {
      const updatedGame = await apiClient.destroyCard(
        gameId,
        playerId,
        card.id
      );
      setGameState(updatedGame);
      setCardFaceUpMap((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to destroy card");
    } finally {
      setIsLoading(false);
    }
  };

  const manipulateTopCard = async (
    theater: TheaterType,
    action: "flip" | "destroy" | "return"
  ) => {
    if (!gameState) return;
    setIsLoading(true);
    setError("");

    try {
      const updatedGame = await apiClient.manipulateCard(
        gameId,
        playerId,
        theater,
        action
      );
      setGameState(updatedGame);
    } catch (err) {
      console.error(err);
      const verb =
        action === "flip"
          ? "flip"
          : action === "destroy"
          ? "destroy"
          : "return";
      setError(`Failed to ${verb} card`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndTurn = async () => {
    if (!gameState) return;
    setIsLoading(true);
    setError("");
    try {
      const updatedGame = await apiClient.endTurn(gameId, playerId);
      setGameState(updatedGame);
    } catch (err) {
      setError("Failed to end turn");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawCard = async () => {
    if (!gameState) return;
    setIsLoading(true);
    setError("");
    try {
      const updatedGame = await apiClient.drawCard(gameId, playerId);
      setGameState(updatedGame);
    } catch (err) {
      setError("Failed to draw card");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (
      !gameState ||
      !window.confirm("Are you sure you want to withdraw from this battle?")
    ) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const updatedGame = await apiClient.withdraw(gameId, playerId);
      setGameState(updatedGame);
    } catch (err) {
      setError("Failed to withdraw");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScoresToServer = async (scores: Record<TheaterType, number>) => {
    if (!gameState) return;
    setIsLoading(true);
    setError("");
    try {
      const updatedGame = await apiClient.updateScores(
        gameId,
        playerId,
        scores
      );
      setGameState(updatedGame);
    } catch (err) {
      setError("Failed to submit scores");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNextBattle = useCallback(async () => {
    setIsLoading(true);
    setError("");
    let success = false;
    try {
      const updatedGame = await apiClient.startNextBattle(gameId);
      setGameState(updatedGame);
      success = true;
    } catch (err) {
      setError("Failed to start next battle");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    return success;
  }, [gameId]);

  const startNextGame = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const updatedGame = await apiClient.startNextGame(gameId);
      setGameState(updatedGame);
    } catch (err) {
      setError("Failed to start next game");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameState || isLoading) {
      return;
    }

    if (
      gameState.phase === "scoring" &&
      gameState.withdrewPlayerId &&
      autoAdvanceBattleRef.current !== gameState.battleNumber
    ) {
      autoAdvanceBattleRef.current = gameState.battleNumber;
      const advance = async () => {
        const success = await startNextBattle();
        if (!success) {
          autoAdvanceBattleRef.current = null;
        }
      };
      void advance();
    } else if (
      gameState.phase === "playing" ||
      gameState.phase === "game_over"
    ) {
      autoAdvanceBattleRef.current = null;
    }
  }, [gameState, isLoading, startNextBattle]);

  if (!gameState) {
    return (
      <div className="game-bg d-flex align-items-center justify-content-center">
        <div className="text-white fs-4">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const opponent = getOpponent();
  const preferredTheater =
    dragContext?.type === "hand" && dragContext.faceUp
      ? dragContext.card.theater
      : null;
  const theaterOrder =
    gameState?.theaterOrder && gameState.theaterOrder.length
      ? gameState.theaterOrder
      : DEFAULT_THEATER_ORDER;
  const theaterLabel = theaterOrder.map(formatTheaterName).join(" • ");
  const nextBattleLabel = rotateTheaterOrder(theaterOrder)
    .map(formatTheaterName)
    .join(" • ");
  const isScoringPhase =
    gameState.phase === "scoring" && !gameState.withdrewPlayerId;
  const isPlayer1 = gameState.player1.id === playerId;
  const theaterScoresRecord = (gameState.theaterScores ?? {}) as Partial<
    Record<TheaterType, TheaterScore>
  >;

  const getRecordedScore = (theater: TheaterType, forSelf: boolean) => {
    const record = theaterScoresRecord[theater];
    if (!record) return 0;
    if (forSelf) {
      return isPlayer1 ? record.player1Total : record.player2Total;
    }
    return isPlayer1 ? record.player2Total : record.player1Total;
  };

  const playerSubmitted =
    isScoringPhase &&
    theaterOrder.every((theater) => getRecordedScore(theater, true) > 0);
  const opponentSubmitted =
    isScoringPhase &&
    theaterOrder.every((theater) => getRecordedScore(theater, false) > 0);
  const bothSubmitted = playerSubmitted && opponentSubmitted;
  const allScoresEntered = theaterOrder.every(
    (theater) => scoreInputs[theater]?.trim().length
  );

  const handleSubmitScores = async () => {
    if (!isScoringPhase || playerSubmitted) {
      return;
    }

    const missingScores = theaterOrder.some(
      (theater) => !scoreInputs[theater]?.trim().length
    );

    if (missingScores) {
      setError("Enter a score for each theater before submitting.");
      return;
    }

    setError("");
    const payload: Record<TheaterType, number> = {
      air: Number(scoreInputs.air || 0),
      land: Number(scoreInputs.land || 0),
      sea: Number(scoreInputs.sea || 0),
    };

    await submitScoresToServer(payload);
  };

  const battleWinner = (() => {
    if (!bothSubmitted || !gameState.theaterScores) {
      return null;
    }

    let player1Wins = 0;
    let player2Wins = 0;
    (DEFAULT_THEATER_ORDER as TheaterType[]).forEach((theater) => {
      const scores = gameState.theaterScores?.[theater];
      if (!scores) return;
      if (scores.player1Total > scores.player2Total) {
        player1Wins++;
      } else if (scores.player2Total > scores.player1Total) {
        player2Wins++;
      }
    });

    if (player1Wins >= 2) return gameState.player1;
    if (player2Wins >= 2) return gameState.player2;
    return null;
  })();

  const didIWin = battleWinner?.id === playerId;

  const isCurrentPlayerFirst = playerId === gameState.player1.id;
  const bottomBadgeType: "first" | "second" = isCurrentPlayerFirst
    ? "first"
    : "second";
  const topBadgeType: "first" | "second" = isCurrentPlayerFirst
    ? "second"
    : "first";

  const renderPlayerBadge = (
    type: "first" | "second",
    position: "top" | "bottom",
    options?: { actions?: ReactNode }
  ) => {
    const isFirstBadge = type === "first";
    const badgeCard = isFirstBadge ? FIRST_PLAYER_BADGE : SECOND_PLAYER_BADGE;
    const spacingClass = position === "top" ? "mb-4" : "mt-4";
    const orientationClass = isFirstBadge ? "flex-row" : "flex-row-reverse";
    const infoAlignClass = isFirstBadge ? "text-start" : "text-end";

    return (
      <div
        className={[
          "player-badge",
          spacingClass,
          "d-flex",
          orientationClass,
          "align-items-center",
          "gap-3",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CardComponent
          card={badgeCard}
          faceUp
          style={{ width: "96px", height: "144px" }}
        />
        <div className={`badge-info ${infoAlignClass}`}></div>
        {options?.actions ? (
          <div className="badge-actions d-flex flex-column gap-2">
            {options.actions}
          </div>
        ) : null}
      </div>
    );
  };

  const handDropAllowed = canDropOnTarget("hand");
  const handDropActive = activeDropTarget === "hand";
  const deckDropAllowed = canDropOnTarget("deck");
  const deckDropActive = activeDropTarget === "deck";
  const trashDropAllowed = canDropOnTarget("trash");
  const trashDropActive = activeDropTarget === "trash";
  const canDragHandCards =
    isMyTurn() && gameState.phase === "playing" && !isLoading;
  const shouldShowActions = gameState.phase === "playing" && isMyTurn();
  const actionButtons = shouldShowActions ? (
    <>
      <button
        onClick={handleEndTurn}
        disabled={isLoading}
        className="btn btn-primary btn-lg fw-bold"
      >
        End Turn
      </button>
      <button
        onClick={handleWithdraw}
        disabled={isLoading}
        className="btn btn-outline-danger"
      >
        Withdraw
      </button>
    </>
  ) : null;

  return (
    <div className="game-bg d-flex flex-column" style={{ minHeight: "100vh" }}>
      {error && (
        <div
          className="position-fixed top-0 end-0 m-3 alert alert-danger"
          style={{ zIndex: 1050 }}
        >
          {error}
        </div>
      )}

      {previewCard && (
        <div
          className="card-preview-overlay"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="card-preview-content"
            onClick={(event) => event.stopPropagation()}
          >
            <CardComponent
              card={previewCard}
              faceUp={previewFaceUp}
              style={{
                width: "clamp(200px, 60vw, 320px)",
                height: "calc(clamp(200px, 60vw, 320px) * 1.5)",
                cursor: "default",
              }}
            />
            <div className="text-light text-center fw-semibold">
              {previewFaceUp ? previewCard.name : "Face-down card"}
            </div>
            <button
              className="btn btn-outline-light"
              onClick={(event) => {
                event.stopPropagation();
                closePreview();
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {gameState.phase === "game_over" && (
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
              {currentPlayer && opponent && (
                <>
                  <div className="bg-secondary rounded p-3 mb-2">
                    {currentPlayer.name}:{" "}
                    <span className="fw-bold text-warning">
                      {currentPlayer.score} VP
                    </span>
                  </div>
                  <div className="bg-secondary rounded p-3 mb-4">
                    {opponent.name}:{" "}
                    <span className="fw-bold text-info">
                      {opponent.score} VP
                    </span>
                  </div>
                  <div className="fs-3 fw-bold">
                    {currentPlayer.score >= 12 ? (
                      <span className="text-success">🎉 You Win! 🎉</span>
                    ) : (
                      <span className="text-danger">You Lose</span>
                    )}
                  </div>
                  <div className="mt-4 d-grid">
                    <button
                      className="btn btn-warning btn-lg fw-semibold"
                      onClick={startNextGame}
                      disabled={isLoading}
                    >
                      {isLoading ? "Starting..." : "Next Game"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-3 pt-2 pb-1">
        <div className="container-fluid">
          <div className="row bg-dark bg-opacity-75 rounded-3 px-3 py-2 align-items-center g-2">
            <div className="col text-white">
              <div className="fw-semibold fs-6 text-uppercase text-secondary mb-1">
                Opponent
              </div>
              <div className="fw-bold fs-5">
                Player: {opponent?.name ?? "Waiting"}
              </div>
              <small className="text-secondary">
                {opponent?.score} VP · {opponent?.hand.length} cards
              </small>
            </div>
            <div className="col text-center">
              <small className="text-secondary text-uppercase d-block mb-1">
                Battle {gameState.battleNumber}
              </small>
              <div className="fw-bold fs-5 text-info">{theaterLabel}</div>
              {gameState.phase === "playing" && (
                <div>
                  {isMyTurn() ? (
                    <span className="badge bg-success">YOUR TURN</span>
                  ) : (
                    <span className="badge bg-secondary">
                      {opponent?.name}'s Turn
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="col text-end text-white">
              <div className="fw-semibold fs-6 text-uppercase text-secondary mb-1">
                You
              </div>
              <div className="fw-bold fs-5">
                Player: {currentPlayer?.name ?? "Waiting"}
              </div>
              <small className="text-secondary">
                {currentPlayer?.score} VP · {currentPlayer?.hand.length} cards
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow-1 container-fluid px-4 pb-4 board-scroll">
        <div className="board-layout gap-4">
          <div className="board-main d-flex flex-column align-items-stretch gap-4">
            <div className="d-flex justify-content-center flex-wrap gap-2 opponent-hand">
              {opponent?.hand.map((_, index) => (
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
            <div className="theater-grid">
              {theaterOrder.map((theater) => (
                <div key={theater} className="theater-column d-flex">
                  <div
                    className="theater-slot flex-grow-1 d-flex flex-column align-items-stretch"
                    onDragOver={(event) => handleDragOver(event, theater)}
                    onDragLeave={(event) => handleDragLeave(event, theater)}
                    onDrop={(event) => handleDropOnTarget(event, theater)}
                  >
                    <div className="theater-stage flex-shrink-0">
                      <TheaterComponent
                        type={theater}
                        opponentCards={getPlayerCardsInTheater(theater, true)}
                        playerCards={getPlayerCardsInTheater(theater, false)}
                        isDropAllowed={canDropOnTarget(theater)}
                        isDropActive={activeDropTarget === theater}
                        isPreferred={preferredTheater === theater}
                        onPlayerCardDragStart={(playedCard: PlayedCard) =>
                          handleTheaterCardDragStart(theater, playedCard)
                        }
                        onPlayerCardDragEnd={handleDragEnd}
                        onPlayerCardLongPress={(playedCard: PlayedCard) =>
                          handleCardPreview(playedCard.card, playedCard.faceUp)
                        }
                        onOpponentCardLongPress={(playedCard: PlayedCard) =>
                          handleCardPreview(playedCard.card, playedCard.faceUp)
                        }
                      />
                    </div>
                    {isScoringPhase && (
                      <div className="theater-score-card mt-3">
                        <div className="theater-score-line text-uppercase text-secondary">
                          {opponent?.name ?? "Opponent"}
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
                                handleScoreInputChange(
                                  theater,
                                  event.target.value
                                )
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

            {isScoringPhase && (
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
                        onClick={handleSubmitScores}
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
                  {bothSubmitted && gameState.phase === "scoring" && (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success"
                        onClick={startNextBattle}
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
            )}

            {isScoringPhase && bothSubmitted && (
              <div className="scoring-results-panel bg-dark bg-opacity-25 rounded-3 p-3">
                <div className="text-uppercase text-secondary text-center small fw-semibold">
                  Battle Results
                </div>
                <div className="row g-2 mt-2">
                  {theaterOrder.map((theater) => {
                    const scores = gameState.theaterScores?.[theater];
                    return (
                      <div
                        key={`result-${theater}`}
                        className="col-12 col-md-4"
                      >
                        <div className="scoring-result-tile">
                          <div className="scoring-result-label">
                            {formatTheaterName(theater)}
                          </div>
                          <div className="scoring-result-values">
                            <span>
                              {gameState.player1.name}:{" "}
                              {scores?.player1Total ?? 0}
                            </span>
                            <span>
                              {gameState.player2.name}:{" "}
                              {scores?.player2Total ?? 0}
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
                  {gameState.player1.name}: {gameState.player1.score} VP ·{" "}
                  {gameState.player2.name}: {gameState.player2.score} VP
                </div>
                <div className="text-center text-info small mt-2">
                  Next battle theaters: {nextBattleLabel}
                </div>
              </div>
            )}

            <div
              className={[
                "drop-zone",
                "hand-drop-zone",
                handDropAllowed ? "drop-allowed" : "",
                handDropActive ? "drop-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(event) => handleDragOver(event, "hand")}
              onDragLeave={(event) => handleDragLeave(event, "hand")}
              onDrop={(event) => handleDropOnTarget(event, "hand")}
            >
              <div className="d-flex justify-content-center flex-wrap gap-3">
                {currentPlayer?.hand.map((card) => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    faceUp={getCardFaceUp(card.id)}
                    onClick={() => handleHandCardClick(card)}
                    draggable={canDragHandCards}
                    onDragStart={(event) =>
                      handleHandCardDragStart(event, card)
                    }
                    onDragEnd={handleDragEnd}
                    onLongPress={() =>
                      handleCardPreview(card, getCardFaceUp(card.id))
                    }
                    style={{
                      cursor: canDragHandCards ? "grab" : "pointer",
                      userSelect: "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="board-side">
            <div className="side-panel bg-dark bg-opacity-75 rounded-3 p-3 h-100 d-flex flex-column">
              {renderPlayerBadge(topBadgeType, "top")}
              <div className="flex-grow-1 d-flex flex-column justify-content-center gap-4">
                <div
                  className={[
                    "drop-zone",
                    "deck-drop-zone",
                    deckDropAllowed ? "drop-allowed" : "",
                    deckDropActive ? "drop-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={(event) => handleDragOver(event, "deck")}
                  onDragLeave={(event) => handleDragLeave(event, "deck")}
                  onDrop={(event) => handleDropOnTarget(event, "deck")}
                >
                  <div className="side-title">Deck</div>
                  <div className="side-count">
                    {gameState.deck.length} cards remaining
                  </div>
                  {gameState.phase === "playing" &&
                    isMyTurn() &&
                    gameState.deck.length > 0 && (
                      <button
                        className="btn btn-sm btn-outline-light mt-3"
                        onClick={handleDrawCard}
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
                  onDragOver={(event) => handleDragOver(event, "trash")}
                  onDragLeave={(event) => handleDragLeave(event, "trash")}
                  onDrop={(event) => handleDropOnTarget(event, "trash")}
                >
                  <div className="side-title">Trash</div>
                  <div className="side-count">
                    {gameState.trash.length} cards destroyed
                  </div>
                  <div className="side-hint">
                    Drop a card here to destroy it.
                  </div>
                </div>
              </div>

              {renderPlayerBadge(bottomBadgeType, "bottom", {
                actions: actionButtons,
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
