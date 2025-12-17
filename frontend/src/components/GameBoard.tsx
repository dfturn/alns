import { useCallback, useEffect, useRef, useState } from "react";
import type { TheaterType, TheaterScore, PlayedCard } from "../types";
import { useGameState, useDragDrop, useCardPreview } from "../hooks";
import { ErrorAlert, LoadingScreen } from "./shared";
import {
  GameHeader,
  GameOverModal,
  CardPreviewModal,
  SidePanel,
  TheaterGrid,
  ScoringActionsPanel,
  ScoringResultsPanel,
  OpponentHand,
  PlayerHand,
  TouchDragOverlay,
} from "./game";

interface GameBoardProps {
  gameId: string;
  playerId: string;
  roomId: string;
}

const DEFAULT_THEATER_ORDER: TheaterType[] = ["air", "land", "sea"];

const formatTheaterName = (theater: TheaterType) =>
  theater.charAt(0).toUpperCase() + theater.slice(1);

const rotateTheaterOrder = (order: TheaterType[]) => {
  if (!order.length) return DEFAULT_THEATER_ORDER;
  const rotated = [...order];
  const last = rotated.pop();
  if (last === undefined) return rotated;
  rotated.unshift(last);
  return rotated;
};

export default function GameBoard({ gameId, playerId }: GameBoardProps) {
  const {
    gameState,
    isLoading,
    error,
    playCard,
    destroyCard,
    manipulateCard,
    endTurn,
    drawCard,
    withdraw,
    submitScores,
    startNextBattle,
    startNextGame,
  } = useGameState({ gameId, playerId });

  const {
    preview,
    getCardFaceUp,
    toggleCardFaceUp,
    openHandCardPreview,
    openTheaterCardPreview,
    closePreview,
  } = useCardPreview();

  const {
    dragContext,
    activeDropTarget,
    canDropOnTarget,
    handleHandCardDragStart,
    handleHandCardTouchDragStart,
    handleTheaterCardDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDropOnTarget,
    handleTouchDropOnTarget,
    setActiveDropTarget,
  } = useDragDrop({
    playerId,
    isMyTurn: gameState?.currentPlayerId === playerId,
    isPlaying: gameState?.phase === "playing",
    isLoading,
    onPlayCard: playCard,
    onDestroyCard: destroyCard,
    onManipulateCard: manipulateCard,
    getCardFaceUp,
  });

  const [scoreInputs, setScoreInputs] = useState<Record<TheaterType, string>>({
    air: "",
    land: "",
    sea: "",
  });

  const autoAdvanceBattleRef = useRef<number | null>(null);

  // Score input handling
  const handleScoreInputChange = useCallback(
    (theater: TheaterType, value: string) => {
      const sanitized = value.replace(/[^0-9]/g, "");
      setScoreInputs((prev) => ({ ...prev, [theater]: sanitized }));
    },
    []
  );

  // Reset score inputs when phase changes or when pre-filled from server
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
      return changed ? next : prev;
    });
  }, [gameState, playerId]);

  // Auto-advance battle when someone withdrew
  useEffect(() => {
    if (!gameState || isLoading) return;

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

  // Close preview on Escape key
  useEffect(() => {
    if (!preview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [preview, closePreview]);

  // Lock body scroll when preview is open
  useEffect(() => {
    if (!preview) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [preview]);

  if (!gameState) {
    return <LoadingScreen />;
  }

  // Derived state
  const isMyTurn = gameState.currentPlayerId === playerId;
  const currentPlayer =
    gameState.player1.id === playerId ? gameState.player1 : gameState.player2;
  const opponent =
    gameState.player1.id === playerId ? gameState.player2 : gameState.player1;
  const theaterOrder = gameState.theaterOrder?.length
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

  const preferredTheater =
    dragContext?.type === "hand" && dragContext.faceUp
      ? dragContext.card.theater
      : null;

  const getPlayerCardsInTheater = (
    theater: TheaterType,
    isOpponent: boolean
  ): PlayedCard[] => {
    const targetPlayerId = isOpponent ? opponent.id : playerId;
    return gameState.theaters[theater].cards.filter(
      (pc) => pc.playerId === targetPlayerId
    );
  };

  const getTopCardInStack = (
    theater: TheaterType,
    targetPlayerId: string
  ): PlayedCard | null => {
    const cards = gameState.theaters[theater].cards;
    for (let i = cards.length - 1; i >= 0; i -= 1) {
      if (cards[i].playerId === targetPlayerId) {
        return cards[i];
      }
    }
    return null;
  };

  // Event handlers
  const handleSubmitScores = async () => {
    if (!isScoringPhase || playerSubmitted) return;

    const payload: Record<TheaterType, number> = {
      air: Number(scoreInputs.air || 0),
      land: Number(scoreInputs.land || 0),
      sea: Number(scoreInputs.sea || 0),
    };

    await submitScores(payload);
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw from this battle?"))
      return;
    await withdraw();
  };

  const canDragHandCards =
    isMyTurn && gameState.phase === "playing" && !isLoading;
  const shouldShowActions = gameState.phase === "playing" && isMyTurn;

  const actionButtons = shouldShowActions ? (
    <>
      <button
        onClick={endTurn}
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
      <ErrorAlert message={error} />

      <TouchDragOverlay
        dragContext={dragContext}
        theaterOrder={theaterOrder}
        canDropOnTarget={canDropOnTarget}
        onDropOnTarget={handleTouchDropOnTarget}
        onDragEnd={handleDragEnd}
        setActiveDropTarget={setActiveDropTarget}
      />

      {preview && (
        <CardPreviewModal
          card={preview.card}
          faceUp={preview.faceUp ?? true}
          onClose={closePreview}
        />
      )}

      {gameState.phase === "game_over" && (
        <GameOverModal
          currentPlayer={currentPlayer}
          opponent={opponent}
          isLoading={isLoading}
          onStartNextGame={startNextGame}
        />
      )}

      <GameHeader
        gameState={gameState}
        currentPlayer={currentPlayer}
        opponent={opponent}
        isMyTurn={isMyTurn}
        theaterLabel={theaterLabel}
      />

      <div className="flex-grow-1 container-fluid px-4 pb-4 board-scroll">
        <div className="board-layout gap-4">
          <div className="board-main d-flex flex-column align-items-stretch gap-4">
            <OpponentHand cardCount={opponent.hand.length} />

            <TheaterGrid
              theaterOrder={theaterOrder}
              preferredTheater={preferredTheater}
              isScoringPhase={isScoringPhase}
              playerSubmitted={playerSubmitted}
              isLoading={isLoading}
              isMyTurn={isMyTurn}
              playerId={playerId}
              opponentName={opponent.name}
              theaterScores={theaterScoresRecord}
              isPlayer1={isPlayer1}
              scoreInputs={scoreInputs}
              theaters={gameState.theaters}
              getPlayerCardsInTheater={getPlayerCardsInTheater}
              canDropOnTarget={canDropOnTarget}
              activeDropTarget={activeDropTarget}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropOnTarget}
              onTheaterCardDragStart={handleTheaterCardDragStart}
              onTheaterCardDragEnd={handleDragEnd}
              onTheaterCardClick={(theater, playedCard) => {
                const topCard = getTopCardInStack(theater, playedCard.playerId);
                if (!topCard) return;
                manipulateCard(theater, topCard.card.id, "flip");
              }}
              onCardPreview={(card, faceUp) => {
                if (faceUp) {
                  openHandCardPreview(card);
                } else {
                  openTheaterCardPreview({
                    card,
                    faceUp,
                    playerId: "",
                  } as PlayedCard);
                }
              }}
              onScoreInputChange={handleScoreInputChange}
            />

            {isScoringPhase && (
              <ScoringActionsPanel
                playerSubmitted={playerSubmitted}
                opponentSubmitted={opponentSubmitted}
                allScoresEntered={allScoresEntered}
                isLoading={isLoading}
                showStartNextBattle={gameState.phase === "scoring"}
                nextBattleLabel={nextBattleLabel}
                onSubmitScores={handleSubmitScores}
                onStartNextBattle={startNextBattle}
              />
            )}

            {isScoringPhase && bothSubmitted && (
              <ScoringResultsPanel
                theaterOrder={theaterOrder}
                theaterScores={theaterScoresRecord}
                player1={gameState.player1}
                player2={gameState.player2}
                playerId={playerId}
                nextBattleLabel={nextBattleLabel}
              />
            )}

            <PlayerHand
              cards={currentPlayer.hand}
              canDrag={canDragHandCards}
              dropAllowed={canDropOnTarget("hand")}
              dropActive={activeDropTarget === "hand"}
              getCardFaceUp={getCardFaceUp}
              onCardClick={(card) => toggleCardFaceUp(card.id)}
              onDragStart={handleHandCardDragStart}
              onTouchDragStart={handleHandCardTouchDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropOnTarget}
              onCardLongPress={(card) => openHandCardPreview(card)}
            />
          </div>

          <SidePanel
            gameState={gameState}
            playerId={playerId}
            isMyTurn={isMyTurn}
            isLoading={isLoading}
            deckDropAllowed={canDropOnTarget("deck")}
            deckDropActive={activeDropTarget === "deck"}
            trashDropAllowed={canDropOnTarget("trash")}
            trashDropActive={activeDropTarget === "trash"}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnTarget}
            onDrawCard={drawCard}
            actionButtons={actionButtons}
          />
        </div>
      </div>
    </div>
  );
}
