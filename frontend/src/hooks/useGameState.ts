import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../api";
import type { Card, GameState, TheaterType } from "../types";

interface UseGameStateOptions {
  gameId: string;
  playerId: string;
  pollInterval?: number;
}

interface UseGameStateReturn {
  gameState: GameState | null;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
  clearError: () => void;
  refreshGame: () => Promise<void>;
  playCard: (
    card: Card,
    theater: TheaterType,
    faceUp: boolean
  ) => Promise<void>;
  destroyCard: (card: Card) => Promise<void>;
  manipulateCard: (
    theater: TheaterType,
    cardId: number,
    action: "flip" | "destroy" | "return"
  ) => Promise<void>;
  endTurn: () => Promise<void>;
  drawCard: () => Promise<void>;
  withdraw: () => Promise<void>;
  submitScores: (scores: Record<TheaterType, number>) => Promise<void>;
  startNextBattle: () => Promise<boolean>;
  startNextGame: () => Promise<void>;
}

export function useGameState({
  gameId,
  playerId,
  pollInterval = 2000,
}: UseGameStateOptions): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const autoAdvanceBattleRef = useRef<number | null>(null);

  const clearError = useCallback(() => setError(""), []);

  const refreshGame = useCallback(async () => {
    try {
      const game = await apiClient.getGame(gameId);
      setGameState(game);
    } catch (err) {
      console.error("Failed to load game:", err);
    }
  }, [gameId]);

  // Poll for game updates
  useEffect(() => {
    refreshGame();
    const interval = setInterval(refreshGame, pollInterval);
    return () => clearInterval(interval);
  }, [refreshGame, pollInterval]);

  const playCard = useCallback(
    async (card: Card, theater: TheaterType, faceUp: boolean) => {
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
      } catch (err) {
        console.error(err);
        setError("Failed to play card");
      } finally {
        setIsLoading(false);
      }
    },
    [gameId, playerId, gameState]
  );

  const destroyCard = useCallback(
    async (card: Card) => {
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
      } catch (err) {
        console.error(err);
        setError("Failed to destroy card");
      } finally {
        setIsLoading(false);
      }
    },
    [gameId, playerId, gameState]
  );

  const manipulateCard = useCallback(
    async (
      theater: TheaterType,
      cardId: number,
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
          cardId,
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
    },
    [gameId, playerId, gameState]
  );

  const endTurn = useCallback(async () => {
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
  }, [gameId, playerId, gameState]);

  const drawCard = useCallback(async () => {
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
  }, [gameId, playerId, gameState]);

  const withdraw = useCallback(async () => {
    if (!gameState) return;
    if (
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
  }, [gameId, playerId, gameState]);

  const submitScores = useCallback(
    async (scores: Record<TheaterType, number>) => {
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
    },
    [gameId, playerId, gameState]
  );

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

  // Auto-advance battle after withdrawal (only the withdrawing player triggers this)
  useEffect(() => {
    if (!gameState || isLoading) return;

    // Only the player who withdrew should auto-advance to avoid duplicate requests
    if (
      gameState.phase === "scoring" &&
      gameState.withdrewPlayerId === playerId &&
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
  }, [gameState, isLoading, playerId, startNextBattle]);

  return {
    gameState,
    isLoading,
    error,
    setError,
    clearError,
    refreshGame,
    playCard,
    destroyCard,
    manipulateCard,
    endTurn,
    drawCard,
    withdraw,
    submitScores,
    startNextBattle,
    startNextGame,
  };
}
