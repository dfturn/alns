import { useCallback, useState } from "react";
import type { DragEvent } from "react";
import type { Card, PlayedCard, TheaterType } from "../types";

export type DragContext =
  | { type: "hand"; card: Card; faceUp: boolean }
  | { type: "theater"; theater: TheaterType; playedCard: PlayedCard };

export type DropTarget = TheaterType | "hand" | "deck" | "trash";

interface UseDragDropOptions {
  playerId: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlayCard: (
    card: Card,
    theater: TheaterType,
    faceUp: boolean
  ) => Promise<void>;
  onDestroyCard: (card: Card) => Promise<void>;
  onManipulateCard: (
    theater: TheaterType,
    cardId: number,
    action: "flip" | "destroy" | "return"
  ) => Promise<void>;
  getCardFaceUp: (cardId: number) => boolean;
}

interface UseDragDropReturn {
  dragContext: DragContext | null;
  activeDropTarget: DropTarget | null;
  canDropOnTarget: (target: DropTarget) => boolean;
  handleHandCardDragStart: (
    event: DragEvent<HTMLDivElement>,
    card: Card
  ) => void;
  handleHandCardTouchDragStart: (card: Card) => void;
  handleTheaterCardDragStart: (
    theater: TheaterType,
    playedCard: PlayedCard
  ) => void;
  handleDragEnd: () => void;
  handleDragOver: (
    event: DragEvent<HTMLDivElement>,
    target: DropTarget
  ) => void;
  handleDragLeave: (
    event: DragEvent<HTMLDivElement>,
    target: DropTarget
  ) => void;
  handleDropOnTarget: (
    event: DragEvent<HTMLDivElement>,
    target: DropTarget
  ) => Promise<void>;
  handleTouchDropOnTarget: (target: DropTarget) => Promise<void>;
  setActiveDropTarget: (target: DropTarget | null) => void;
}

export function useDragDrop({
  playerId,
  isMyTurn,
  isPlaying,
  isLoading,
  onPlayCard,
  onDestroyCard,
  onManipulateCard,
  getCardFaceUp,
}: UseDragDropOptions): UseDragDropReturn {
  const [dragContext, setDragContext] = useState<DragContext | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(
    null
  );

  const canDropOnTarget = useCallback(
    (target: DropTarget): boolean => {
      if (!dragContext || isLoading) return false;

      if (dragContext.type === "hand") {
        if (target === "hand" || target === "deck") return false;
        if (target === "trash") return isMyTurn && isPlaying;
        return isMyTurn && isPlaying;
      }

      if (dragContext.type === "theater") {
        if (!isMyTurn || !isPlaying) return false;
        return target === "hand" || target === "deck" || target === "trash";
      }

      return false;
    },
    [dragContext, isLoading, isMyTurn, isPlaying, playerId]
  );

  const handleHandCardDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, card: Card) => {
      if (!isMyTurn || !isPlaying || isLoading) {
        event.preventDefault();
        return;
      }

      const faceUp = getCardFaceUp(card.id);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `hand-${card.id}`);
      setDragContext({ type: "hand", card, faceUp });
    },
    [isMyTurn, isPlaying, isLoading, getCardFaceUp]
  );

  const handleHandCardTouchDragStart = useCallback(
    (card: Card) => {
      if (!isMyTurn || !isPlaying || isLoading) {
        return;
      }

      const faceUp = getCardFaceUp(card.id);
      setDragContext({ type: "hand", card, faceUp });
    },
    [isMyTurn, isPlaying, isLoading, getCardFaceUp]
  );

  const handleTheaterCardDragStart = useCallback(
    (theater: TheaterType, playedCard: PlayedCard) => {
      if (!isMyTurn || !isPlaying || isLoading) {
        return;
      }
      setDragContext({ type: "theater", theater, playedCard });
    },
    [isMyTurn, isPlaying, isLoading]
  );

  const handleDragEnd = useCallback(() => {
    setDragContext(null);
    setActiveDropTarget(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, target: DropTarget) => {
      if (!canDropOnTarget(target)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setActiveDropTarget((prev) => (prev === target ? prev : target));
    },
    [canDropOnTarget]
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>, target: DropTarget) => {
      const related = event.relatedTarget as Node | null;
      if (related && event.currentTarget.contains(related)) return;
      setActiveDropTarget((prev) => (prev === target ? null : prev));
    },
    []
  );

  const handleDropOnTarget = useCallback(
    async (event: DragEvent<HTMLDivElement>, target: DropTarget) => {
      event.preventDefault();

      if (!dragContext || isLoading) return;
      if (!canDropOnTarget(target)) return;

      const context = dragContext;
      setActiveDropTarget(null);

      try {
        if (target === "hand" && context.type === "theater") {
          await onManipulateCard(
            context.theater,
            context.playedCard.card.id,
            "return"
          );
        } else if (target === "deck" && context.type === "theater") {
          await onManipulateCard(
            context.theater,
            context.playedCard.card.id,
            "flip"
          );
        } else if (target === "trash" && context.type === "theater") {
          await onManipulateCard(
            context.theater,
            context.playedCard.card.id,
            "destroy"
          );
        } else if (target === "trash" && context.type === "hand") {
          await onDestroyCard(context.card);
        } else if (
          target !== "hand" &&
          target !== "deck" &&
          target !== "trash"
        ) {
          if (context.type === "hand") {
            await onPlayCard(context.card, target, context.faceUp);
          }
        }
      } finally {
        setDragContext(null);
      }
    },
    [
      dragContext,
      isLoading,
      canDropOnTarget,
      onPlayCard,
      onDestroyCard,
      onManipulateCard,
    ]
  );

  const handleTouchDropOnTarget = useCallback(
    async (target: DropTarget) => {
      if (!dragContext || isLoading) return;
      if (!canDropOnTarget(target)) return;

      const context = dragContext;
      setActiveDropTarget(null);

      try {
        if (target === "hand" && context.type === "theater") {
          await onManipulateCard(
            context.theater,
            context.playedCard.card.id,
            "return"
          );
        } else if (target === "deck" && context.type === "theater") {
          await onManipulateCard(
            context.theater,
            context.playedCard.card.id,
            "flip"
          );
        } else if (target === "trash" && context.type === "theater") {
          await onManipulateCard(
            context.theater,
            context.playedCard.card.id,
            "destroy"
          );
        } else if (target === "trash" && context.type === "hand") {
          await onDestroyCard(context.card);
        } else if (
          target !== "hand" &&
          target !== "deck" &&
          target !== "trash"
        ) {
          if (context.type === "hand") {
            await onPlayCard(context.card, target, context.faceUp);
          }
        }
      } finally {
        setDragContext(null);
      }
    },
    [
      dragContext,
      isLoading,
      canDropOnTarget,
      onPlayCard,
      onDestroyCard,
      onManipulateCard,
    ]
  );

  return {
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
  };
}
