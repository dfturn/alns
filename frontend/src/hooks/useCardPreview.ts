import { useState, useCallback } from "react";
import type { Card, PlayedCard } from "../types";

type CardPreviewSource = "hand" | "theater";

interface CardPreview {
  card: Card;
  source: CardPreviewSource;
  faceUp?: boolean;
}

interface UseCardPreviewReturn {
  preview: CardPreview | null;
  cardFaceUpState: Record<number, boolean>;
  getCardFaceUp: (cardId: number) => boolean;
  toggleCardFaceUp: (cardId: number) => void;
  openHandCardPreview: (card: Card) => void;
  openTheaterCardPreview: (playedCard: PlayedCard) => void;
  closePreview: () => void;
}

export function useCardPreview(): UseCardPreviewReturn {
  const [preview, setPreview] = useState<CardPreview | null>(null);
  const [cardFaceUpState, setCardFaceUpState] = useState<
    Record<number, boolean>
  >({});

  const getCardFaceUp = useCallback(
    (cardId: number): boolean => {
      return cardFaceUpState[cardId] ?? true;
    },
    [cardFaceUpState]
  );

  const toggleCardFaceUp = useCallback((cardId: number) => {
    setCardFaceUpState((prev) => ({
      ...prev,
      [cardId]: !(prev[cardId] ?? true),
    }));
  }, []);

  const openHandCardPreview = useCallback((card: Card) => {
    setPreview({ card, source: "hand" });
  }, []);

  const openTheaterCardPreview = useCallback((playedCard: PlayedCard) => {
    setPreview({
      card: playedCard.card,
      source: "theater",
      faceUp: playedCard.faceUp,
    });
  }, []);

  const closePreview = useCallback(() => {
    setPreview(null);
  }, []);

  return {
    preview,
    cardFaceUpState,
    getCardFaceUp,
    toggleCardFaceUp,
    openHandCardPreview,
    openTheaterCardPreview,
    closePreview,
  };
}
