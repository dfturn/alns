import type {
  CreateRoomResponse,
  JoinRoomResponse,
  GameState,
  Room,
  TheaterType,
} from "./types";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || import.meta.env.VITE_API_URL || "http://localhost:8080";
  }

  async createRoom(playerName: string): Promise<CreateRoomResponse> {
    const response = await fetch(`${this.baseUrl}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerName }),
    });

    if (!response.ok) {
      throw new Error("Failed to create room");
    }

    return response.json();
  }

  async joinRoom(
    roomId: string,
    playerName: string
  ): Promise<JoinRoomResponse> {
    const response = await fetch(`${this.baseUrl}/api/rooms/${roomId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerName }),
    });

    if (!response.ok) {
      throw new Error("Failed to join room");
    }

    return response.json();
  }

  async getRoom(roomId: string): Promise<Room> {
    const response = await fetch(`${this.baseUrl}/api/rooms/${roomId}`);

    if (!response.ok) {
      throw new Error("Failed to get room");
    }

    return response.json();
  }

  async getGame(gameId: string): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`);

    if (!response.ok) {
      throw new Error("Failed to get game");
    }

    return response.json();
  }

  async playCard(
    gameId: string,
    playerId: string,
    cardId: number,
    theater: TheaterType,
    faceUp: boolean
  ): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/play-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, cardId, theater, faceUp }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to play card");
    }

    return response.json();
  }

  async endTurn(gameId: string, playerId: string): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/end-turn`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to end turn");
    }

    return response.json();
  }

  async drawCard(gameId: string, playerId: string): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/draw-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to draw card");
    }

    return response.json();
  }

  async manipulateCard(
    gameId: string,
    playerId: string,
    theater: TheaterType,
    action: "flip" | "destroy" | "return"
  ): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/manipulate-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, theater, action }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to manipulate card");
    }

    return response.json();
  }

  async destroyCard(
    gameId: string,
    playerId: string,
    cardId: number
  ): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/destroy-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, cardId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to destroy card");
    }

    return response.json();
  }

  async withdraw(gameId: string, playerId: string): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/withdraw`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to withdraw");
    }

    return response.json();
  }

  async updateScores(
    gameId: string,
    playerId: string,
    scores: Record<TheaterType, number>
  ): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/update-scores`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, scores }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update scores");
    }

    return response.json();
  }

  async startNextBattle(gameId: string): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/next-battle`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to start next battle");
    }

    return response.json();
  }

  async startNextGame(gameId: string): Promise<GameState> {
    const response = await fetch(
      `${this.baseUrl}/api/games/${gameId}/next-game`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to start next game");
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
