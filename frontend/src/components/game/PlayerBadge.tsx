import type { ReactNode } from "react";
import type { Card } from "../../types";
import CardComponent from "../Card";

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

interface PlayerBadgeProps {
  type: "first" | "second";
  position: "top" | "bottom";
  actions?: ReactNode;
}

export function PlayerBadge({ type, position, actions }: PlayerBadgeProps) {
  const isFirstBadge = type === "first";
  const badgeCard = isFirstBadge ? FIRST_PLAYER_BADGE : SECOND_PLAYER_BADGE;
  const spacingClass = position === "top" ? "mb-4" : "mt-4";
  const orientationClass = isFirstBadge ? "flex-row" : "flex-row-reverse";
  const infoAlignClass = isFirstBadge ? "text-start" : "text-end";

  return (
    <div className={spacingClass}>
      <div
        className={[
          "player-badge",
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
      </div>
      {actions ? (
        <div className="badge-actions d-flex flex-column gap-2 mt-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
