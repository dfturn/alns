// Card sprite positions in the all_cards.jpg grid (6x4)
// Each card is 1/6 of width and 1/4 of height

export interface CardPosition {
  row: number;
  col: number;
}

// Mapping of card name to grid position based on theater and strength
// Grid layout as described:
// Row 0: 6 sea, 1st player, 2nd player, 1 air, 2 air, 3 air
// Row 1: 4 air, 5 air, 6 air, 1 land, 2 land, 3 land
// Row 2: 4 land, 5 land, 6 land, 1 sea, 2 sea, 5 sea
// Row 3: 4 sea, 3 sea, empty, empty, empty, card back

export const cardPositions: Record<string, CardPosition> = {
  // Air cards
  "Air Drop": { row: 0, col: 3 }, // 1 air
  "Air Superiority": { row: 0, col: 4 }, // 2 air
  Aerodrome: { row: 0, col: 5 }, // 3 air
  Maneuver: { row: 1, col: 0 }, // 4 air
  Transport: { row: 1, col: 1 }, // 5 air
  "Heavy Bombers": { row: 1, col: 2 }, // 6 air

  // Land cards
  Ambush: { row: 1, col: 3 }, // 1 land
  Reconnaissance: { row: 1, col: 4 }, // 2 land
  Support: { row: 1, col: 5 }, // 3 land
  Reinforce: { row: 2, col: 0 }, // 4 land
  Armor: { row: 2, col: 1 }, // 5 land
  "Heavy Tanks": { row: 2, col: 2 }, // 6 land

  // Sea cards
  Disrupt: { row: 2, col: 3 }, // 1 sea
  "Naval Superiority": { row: 2, col: 4 }, // 2 sea
  Redeploy: { row: 3, col: 1 }, // 3 sea
  Escalation: { row: 3, col: 0 }, // 4 sea
  Containment: { row: 2, col: 5 }, // 5 sea
  Blockade: { row: 0, col: 0 }, // 6 sea

  // Special cards (if they exist in images but not in game data)
  "1st player": { row: 0, col: 1 },
  "2nd player": { row: 0, col: 2 },

  // Card back
  "card-back": { row: 3, col: 5 },
};

// Get background position for a card
export function getCardBackgroundPosition(
  cardName: string,
  isFaceUp: boolean
): string {
  if (!isFaceUp) {
    const backPos = cardPositions["card-back"];
    // Use exact positioning: for a 6-column grid, each column is at: 0%, 20%, 40%, 60%, 80%, 100%
    // For a 4-row grid, each row is at: 0%, 33.333%, 66.666%, 100%
    const xPos = backPos.col * 20;
    const yPos = backPos.row * 33.333333;
    return `${xPos}% ${yPos}%`;
  }

  const position = cardPositions[cardName];
  if (!position) {
    console.warn(`Card position not found for: ${cardName}`);
    // Default to card back if not found
    const backPos = cardPositions["card-back"];
    const xPos = backPos.col * 20;
    const yPos = backPos.row * 33.333333;
    return `${xPos}% ${yPos}%`;
  }

  // For a 6-column grid: 0%, 20%, 40%, 60%, 80%, 100%
  // For a 4-row grid: 0%, 33.333%, 66.666%, 100%
  const xPos = position.col * 20;
  const yPos = position.row * 33.333333;
  return `${xPos}% ${yPos}%`;
}

export function getCardBackgroundSize(): string {
  // 6 columns wide, 4 rows tall
  return "600% 400%";
}
