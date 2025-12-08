import type { CSSProperties, DragEvent, TouchEvent } from "react";
import { useRef } from "react";
import type { Card as CardType } from "../types";
import {
  getCardBackgroundPosition,
  getCardBackgroundSize,
} from "../cardSprites";

interface CardProps {
  card: CardType | null;
  faceUp: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  rotated?: boolean;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: DragEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
  onLongPress?: () => void;
  longPressThreshold?: number;
}

export default function Card({
  card,
  faceUp,
  onClick,
  isSelected = false,
  className = "",
  rotated = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  style = {},
  onLongPress,
  longPressThreshold = 500,
}: CardProps) {
  const cardName = card?.name || "card-back";
  const backgroundPosition = getCardBackgroundPosition(cardName, faceUp);
  const backgroundSize = getCardBackgroundSize();
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!onLongPress) return;
    if (event.touches.length > 1) return;
    clearLongPress();
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      longPressTriggered.current = true;
      onLongPress();
    }, longPressThreshold);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!onLongPress) return;
    if (event.touches.length !== 1) {
      clearLongPress();
      longPressTriggered.current = false;
      return;
    }
    clearLongPress();
    longPressTriggered.current = false;
  };

  const handleTouchEnd = () => {
    clearLongPress();
  };

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    onClick?.();
  };

  const cardStyle: CSSProperties = {
    width: "128px",
    height: "192px",
    backgroundImage: "url(/all_cards.jpg)",
    backgroundPosition: backgroundPosition,
    backgroundSize: backgroundSize,
    backgroundRepeat: "no-repeat",
    ...style,
  };

  const classes = [
    "game-card",
    isSelected ? "selected" : "",
    rotated ? "rotated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      onClick={handleClick}
      className={classes}
      style={cardStyle}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearLongPress}
      onTouchMove={handleTouchMove}
    />
  );
}
