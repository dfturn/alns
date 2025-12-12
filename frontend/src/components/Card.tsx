import type { CSSProperties, DragEvent, TouchEvent } from "react";
import { useRef, useCallback } from "react";
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
  onTouchDragStart?: () => void;
  onTouchDragEnd?: () => void;
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
  onTouchDragStart,
  // onTouchDragEnd is intentionally not used - TouchDragOverlay handles the drop
  onTouchDragEnd: _onTouchDragEnd,
  style = {},
  onLongPress,
  longPressThreshold = 500,
}: CardProps) {
  const cardName = card?.name || "card-back";
  const backgroundPosition = getCardBackgroundPosition(cardName, faceUp);
  const backgroundSize = getCardBackgroundSize();
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length > 1) return;

      const touch = event.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      isDragging.current = false;
      longPressTriggered.current = false;

      // Set up long press timer if handler exists
      if (onLongPress) {
        clearLongPress();
        longPressTimer.current = window.setTimeout(() => {
          longPressTimer.current = null;
          longPressTriggered.current = true;
          onLongPress();
        }, longPressThreshold);
      }

      // If draggable, prevent default to stop scroll
      if (draggable && onTouchDragStart) {
        event.preventDefault();
      }
    },
    [draggable, onLongPress, onTouchDragStart, longPressThreshold]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length !== 1) {
        clearLongPress();
        longPressTriggered.current = false;
        isDragging.current = false;
        return;
      }

      const touch = event.touches[0];
      const startPos = touchStartPos.current;

      if (!startPos) return;

      const deltaX = Math.abs(touch.clientX - startPos.x);
      const deltaY = Math.abs(touch.clientY - startPos.y);
      const moveThreshold = 10;

      // If moved enough, cancel long press and start drag
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearLongPress();
        longPressTriggered.current = false;

        // Start drag if draggable and not already dragging
        if (draggable && !isDragging.current && onTouchDragStart) {
          isDragging.current = true;
          onTouchDragStart();
          event.preventDefault();
        }
      }

      // Prevent scroll while dragging
      if (isDragging.current) {
        event.preventDefault();
      }
    },
    [draggable, onTouchDragStart]
  );

  const handleTouchEnd = useCallback(() => {
    clearLongPress();
    // Don't call onTouchDragEnd here - let TouchDragOverlay handle the drop
    // It will call handleDragEnd after processing the drop target
    touchStartPos.current = null;
    isDragging.current = false;
  }, []);

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (isDragging.current) {
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
    touchAction: draggable ? "none" : "auto",
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
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchMove}
    />
  );
}
