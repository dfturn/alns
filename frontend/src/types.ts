export type TheaterType = "air" | "land" | "sea";

export interface Card {
  id: number;
  theater: TheaterType;
  strength: number;
  name: string;
}

export interface PlayedCard {
  card: Card;
  faceUp: boolean;
  playerId: string;
}

export interface Theater {
  type: TheaterType;
  cards: PlayedCard[];
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
}

export interface TheaterScore {
  player1Total: number;
  player2Total: number;
}

export type GamePhase = "waiting" | "playing" | "scoring" | "game_over";

export interface GameState {
  id: string;
  roomId: string;
  player1: Player;
  player2: Player;
  deck: Card[];
  trash: Card[];
  theaterOrder: TheaterType[];
  theaters: Record<TheaterType, Theater>;
  currentPlayerId: string;
  phase: GamePhase;
  battleNumber: number;
  firstPlayerId: string;
  withdrewPlayerId?: string;
  theaterScores?: Record<TheaterType, TheaterScore>;
}

export type RoomStatus = "waiting" | "full" | "playing";

export interface Room {
  id: string;
  player1?: Player;
  player2?: Player;
  gameId?: string;
  status: RoomStatus;
}

export interface CreateRoomResponse {
  room: Room;
  playerId: string;
}

export interface JoinRoomResponse {
  room: Room;
  game: GameState;
  playerId: string;
}
