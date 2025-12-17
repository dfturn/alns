import type { CSSProperties, DragEvent, TouchEvent } from "react";
import { useRef, useCallback, useEffect } from "react";
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
  onDoubleTap?: () => void;
  doubleTapThreshold?: number;
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
  onDoubleTap,
  doubleTapThreshold = 300,
}: CardProps) {
  const cardName = card?.name || "card-back";
  const backgroundPosition = getCardBackgroundPosition(cardName, faceUp);
  const backgroundSize = getCardBackgroundSize();
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const doubleTapTriggered = useRef(false);
  const lastTapTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const singleTapTimer = useRef<number | null>(null);
  const awaitingSingleTap = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const clearSingleTapTimer = () => {
    if (singleTapTimer.current !== null) {
      window.clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
    }
    awaitingSingleTap.current = false;
  };

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length > 1) return;

      const touch = event.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      isDragging.current = false;
      longPressTriggered.current = false;
      doubleTapTriggered.current = false;
      clearSingleTapTimer();

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
    const wasDragging = isDragging.current;
    isDragging.current = false;

    if (onDoubleTap && !wasDragging && !longPressTriggered.current) {
      const now = Date.now();
      if (now - lastTapTime.current < doubleTapThreshold) {
        doubleTapTriggered.current = true;
        lastTapTime.current = 0;
        clearSingleTapTimer();
        onDoubleTap();
        return;
      }

      doubleTapTriggered.current = false;
      lastTapTime.current = now;

      if (onClick) {
        awaitingSingleTap.current = true;
        clearSingleTapTimer();
        singleTapTimer.current = window.setTimeout(() => {
          singleTapTimer.current = null;
          const shouldTrigger = awaitingSingleTap.current;
          awaitingSingleTap.current = false;
          if (shouldTrigger && !longPressTriggered.current) {
            onClick();
          }
        }, doubleTapThreshold);
      }
      return;
    }

    doubleTapTriggered.current = false;
    lastTapTime.current = 0;
  }, [doubleTapThreshold, onClick, onDoubleTap]);

  useEffect(() => {
    return () => {
      clearLongPress();
      clearSingleTapTimer();
    };
  }, []);

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (doubleTapTriggered.current) {
      doubleTapTriggered.current = false;
      return;
    }
    if (awaitingSingleTap.current) {
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
    WebkitTouchCallout: "none",
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
      onContextMenu={(event) => event.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchMove}
    />
  );
}
