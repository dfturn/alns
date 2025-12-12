import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import CardComponent from "./Card";
import type { TheaterType, PlayedCard } from "../types";

const BASE_CARD_WIDTH = 128;
const BASE_CARD_HEIGHT = 192;
const STACK_VISIBLE_RATIO = 0.22;
const MAX_CARD_WIDTH = 200;
const MIN_CARD_WIDTH = 96;

interface TheaterProps {
  type: TheaterType;
  opponentCards: PlayedCard[];
  playerCards: PlayedCard[];
  maxOpponentCards: number;
  maxPlayerCards: number;
  isDropAllowed?: boolean;
  isDropActive?: boolean;
  isPreferred?: boolean;
  onPlayerCardClick?: (playedCard: PlayedCard, index: number) => void;
  onPlayerCardDragStart?: (playedCard: PlayedCard, index: number) => void;
  onPlayerCardDragEnd?: () => void;
  onPlayerCardLongPress?: (playedCard: PlayedCard, index: number) => void;
  onOpponentCardLongPress?: (playedCard: PlayedCard, index: number) => void;
}

function getTheaterInfo(type: TheaterType) {
  switch (type) {
    case "air":
      return {
        backgroundImage: "url(/air.jpg)",
        borderColor: "#0ea5e9",
        label: "AIR",
      };
    case "land":
      return {
        backgroundImage: "url(/land.jpg)",
        borderColor: "#22c55e",
        label: "LAND",
      };
    case "sea":
      return {
        backgroundImage: "url(/sea.jpg)",
        borderColor: "#3b82f6",
        label: "SEA",
      };
  }
}

export default function Theater({
  type,
  opponentCards,
  playerCards,
  maxOpponentCards,
  maxPlayerCards,
  isDropAllowed = false,
  isDropActive = false,
  isPreferred = false,
  onPlayerCardClick,
  onPlayerCardDragStart,
  onPlayerCardDragEnd,
  onPlayerCardLongPress,
  onOpponentCardLongPress,
}: TheaterProps) {
  const info = getTheaterInfo(type);

  const frameRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState(() => {
    const cardHeight = BASE_CARD_HEIGHT;
    return {
      cardWidth: BASE_CARD_WIDTH,
      cardHeight,
      stackOffset: cardHeight * STACK_VISIBLE_RATIO,
    };
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateDimensions = () => {
      const horizontalPadding = 24; // theater-frame has 12px left/right padding
      const usableWidth = Math.max(
        frame.clientWidth - horizontalPadding,
        MIN_CARD_WIDTH
      );
      const cardWidth = Math.max(
        Math.min(usableWidth, MAX_CARD_WIDTH),
        MIN_CARD_WIDTH
      );
      const cardHeight = (cardWidth / BASE_CARD_WIDTH) * BASE_CARD_HEIGHT;
      const stackOffset = Math.max(cardHeight * STACK_VISIBLE_RATIO, 28);
      setDimensions({ cardWidth, cardHeight, stackOffset });
    };

    updateDimensions();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateDimensions());
      observer.observe(frame);

      return () => observer.disconnect();
    }

    return undefined;
  }, []);

  const { cardWidth, cardHeight, stackOffset } = dimensions;

  const frameClasses = [
    "theater-frame",
    "border",
    isDropAllowed ? "drop-allowed" : "",
    isDropActive ? "drop-active" : "",
    isPreferred ? "drop-preferred" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const frameStyle: CSSProperties = {
    borderColor: info.borderColor,
    width: "100%",
    height: "100%",
  };

  const baseStyle: CSSProperties = {
    backgroundImage: info.backgroundImage,
    width: "100%",
    // Use aspect ratio to maintain proper proportions (images are roughly 3:2)
    aspectRatio: "3 / 2",
  };

  // Use max card counts across all theaters for consistent stack heights
  // This ensures all theater images align horizontally
  const minCards = 1;
  const effectiveMaxOpponent = Math.max(maxOpponentCards, minCards);
  const effectiveMaxPlayer = Math.max(maxPlayerCards, minCards);

  // Calculate stack heights based on max counts, not actual counts
  const playerStackHeight = cardHeight + (effectiveMaxPlayer - 1) * stackOffset;
  const opponentStackHeight =
    cardHeight + (effectiveMaxOpponent - 1) * stackOffset;

  return (
    <div className={frameClasses} style={frameStyle} ref={frameRef}>
      <div
        className="theater-stack opponent-stack"
        style={{ height: opponentStackHeight, width: `${cardWidth}px` }}
      >
        {opponentCards.map((playedCard, index) => {
          const offset = index * stackOffset;
          return (
            <CardComponent
              key={`${playedCard.card.id}-opponent-${index}`}
              card={playedCard.card}
              faceUp={playedCard.faceUp}
              rotated
              onLongPress={() => onOpponentCardLongPress?.(playedCard, index)}
              style={{
                position: "absolute",
                left: "50%",
                transform: "translate(-50%, -100%) rotate(180deg)",
                top: offset + cardHeight,
                pointerEvents: "none",
                userSelect: "none",
                boxShadow: "0 -6px 20px rgba(0,0,0,0.35)",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                zIndex: opponentCards.length - index,
              }}
            />
          );
        })}
      </div>

      <div className="theater-base" style={baseStyle}></div>

      <div
        className="theater-stack player-stack"
        style={{ height: playerStackHeight, width: `${cardWidth}px` }}
      >
        {playerCards.map((playedCard, index) => {
          const offset = (playerCards.length - 1 - index) * stackOffset;
          const isTopCard = index === playerCards.length - 1;
          return (
            <CardComponent
              key={`${playedCard.card.id}-player-${index}`}
              card={playedCard.card}
              faceUp={playedCard.faceUp}
              onClick={
                isTopCard
                  ? () => onPlayerCardClick?.(playedCard, index)
                  : undefined
              }
              draggable={isTopCard}
              onDragStart={
                isTopCard
                  ? (event) => {
                      onPlayerCardDragStart?.(playedCard, index);
                      event.dataTransfer.setData("text/plain", "player-card");
                    }
                  : undefined
              }
              onDragEnd={
                isTopCard
                  ? (event) => {
                      onPlayerCardDragEnd?.();
                      event.preventDefault();
                    }
                  : undefined
              }
              onLongPress={() => onPlayerCardLongPress?.(playedCard, index)}
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: offset,
                pointerEvents: isTopCard ? "auto" : "none",
                cursor: isTopCard ? "grab" : "default",
                userSelect: "none",
                boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                zIndex: 100 + index,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
