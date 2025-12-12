import { useEffect, useCallback, useRef, useState } from "react";
import type { TheaterType } from "../../types";
import type { DropTarget, DragContext } from "../../hooks";
import CardComponent from "../Card";

interface TouchDragOverlayProps {
  dragContext: DragContext | null;
  theaterOrder: TheaterType[];
  canDropOnTarget: (target: DropTarget) => boolean;
  onDropOnTarget: (target: DropTarget) => void;
  onDragEnd: () => void;
  setActiveDropTarget: (target: DropTarget | null) => void;
}

export function TouchDragOverlay({
  dragContext,
  theaterOrder,
  canDropOnTarget,
  onDropOnTarget,
  onDragEnd,
  setActiveDropTarget,
}: TouchDragOverlayProps) {
  const lastTargetRef = useRef<DropTarget | null>(null);
  const [touchPosition, setTouchPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const findDropTarget = useCallback(
    (x: number, y: number): DropTarget | null => {
      const element = document.elementFromPoint(x, y);
      if (!element) return null;

      // Check for theater drop zones
      for (const theater of theaterOrder) {
        const theaterEl = element.closest(`[data-drop-target="${theater}"]`);
        if (theaterEl && canDropOnTarget(theater)) {
          return theater;
        }
      }

      // Check for trash drop zone
      const trashEl = element.closest('[data-drop-target="trash"]');
      if (trashEl && canDropOnTarget("trash")) {
        return "trash";
      }

      // Check for deck drop zone
      const deckEl = element.closest('[data-drop-target="deck"]');
      if (deckEl && canDropOnTarget("deck")) {
        return "deck";
      }

      // Check for hand drop zone
      const handEl = element.closest('[data-drop-target="hand"]');
      if (handEl && canDropOnTarget("hand")) {
        return "hand";
      }

      return null;
    },
    [theaterOrder, canDropOnTarget]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!dragContext) return;

      const touch = event.touches[0];
      if (!touch) return;

      // Update position for visual feedback
      setTouchPosition({ x: touch.clientX, y: touch.clientY });

      const target = findDropTarget(touch.clientX, touch.clientY);

      if (target !== lastTargetRef.current) {
        lastTargetRef.current = target;
        setActiveDropTarget(target);
      }

      // Prevent scrolling while dragging
      event.preventDefault();
    },
    [dragContext, findDropTarget, setActiveDropTarget]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!dragContext) return;

      // Use the last known target from touch move
      // If changedTouches has coordinates, use those as final position
      const touch = event.changedTouches[0];
      let finalTarget = lastTargetRef.current;

      if (touch) {
        finalTarget = findDropTarget(touch.clientX, touch.clientY);
      }

      if (finalTarget && canDropOnTarget(finalTarget)) {
        onDropOnTarget(finalTarget);
      } else {
        onDragEnd();
      }

      lastTargetRef.current = null;
      setActiveDropTarget(null);
      setTouchPosition(null);
    },
    [
      dragContext,
      findDropTarget,
      canDropOnTarget,
      onDropOnTarget,
      onDragEnd,
      setActiveDropTarget,
    ]
  );

  useEffect(() => {
    if (!dragContext) return;

    // Add global touch listeners when dragging
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [dragContext, handleTouchMove, handleTouchEnd]);

  // Render floating card that follows touch position
  if (!dragContext || !touchPosition) return null;

  const card =
    dragContext.type === "hand"
      ? dragContext.card
      : dragContext.playedCard.card;

  const isFaceUp =
    dragContext.type === "hand" ? true : dragContext.playedCard.faceUp;

  return (
    <div
      style={{
        position: "fixed",
        left: touchPosition.x,
        top: touchPosition.y,
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
        pointerEvents: "none",
        opacity: 0.9,
        filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))",
        width: 70,
        height: 98,
      }}
    >
      <CardComponent
        card={card}
        faceUp={isFaceUp}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
