import { useState } from "react";
import { apiClient } from "../api";
import type { Room } from "../types";

interface RoomLobbyProps {
  onGameStart: (gameId: string, playerId: string, roomId: string) => void;
}

export default function RoomLobby({ onGameStart }: RoomLobbyProps) {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.createRoom(playerName);
      setCurrentRoom(response.room);
      setRoomId(response.room.id);
      pollForPlayers(response.room.id, response.playerId);
    } catch (err) {
      setError("Failed to create room");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.joinRoom(roomId, playerName);
      setCurrentRoom(response.room);
      if (response.game) {
        onGameStart(response.game.id, response.playerId, response.room.id);
      }
    } catch (err) {
      setError("Failed to join room. Check the room ID and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const pollForPlayers = async (roomId: string, playerId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const room = await apiClient.getRoom(roomId);
        setCurrentRoom(room);
        if (room.status === "playing" && room.gameId) {
          clearInterval(pollInterval);
          onGameStart(room.gameId, playerId, roomId);
        }
      } catch (err) {
        console.error("Error polling room:", err);
        clearInterval(pollInterval);
      }
    }, 1000);
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  if (currentRoom && currentRoom.status === "waiting") {
    return (
      <div className="lobby-bg d-flex align-items-center justify-content-center">
        <div
          className="card shadow-lg"
          style={{ maxWidth: "450px", width: "100%" }}
        >
          <div className="card-body p-4">
            <h2 className="card-title text-center mb-4">
              Waiting for Opponent...
            </h2>

            <div className="bg-light border border-primary rounded-3 p-4 mb-4 text-center">
              <p className="text-muted mb-2">Share this Room Code:</p>
              <div
                className="bg-white border border-primary rounded p-3 mb-3 font-monospace fs-2 fw-bold text-primary"
                style={{ letterSpacing: "0.2em" }}
              >
                {currentRoom.id}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(currentRoom.id)}
                className="btn btn-primary w-100"
              >
                📋 Copy Code
              </button>
            </div>

            <div className="d-flex justify-content-center mb-3">
              <div
                className="spinner-border text-primary"
                style={{ width: "3rem", height: "3rem" }}
              />
            </div>

            <p className="text-center text-muted">
              Game will start when another player joins
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-bg d-flex align-items-center justify-content-center p-3">
      <div
        className="card shadow-lg"
        style={{ maxWidth: "450px", width: "100%" }}
      >
        <div className="card-body p-4">
          <h1 className="text-center mb-2">Air, Land & Sea</h1>
          <p className="text-center text-muted mb-4">
            A tactical two-player card game
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="mb-4">
            <label className="form-label fw-bold">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="form-control"
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="btn btn-primary w-100 py-2 mb-4"
          >
            {isLoading ? "Creating..." : "Create New Room"}
          </button>

          <div className="d-flex align-items-center mb-4">
            <hr className="flex-grow-1" />
            <span className="px-3 text-muted">OR</span>
            <hr className="flex-grow-1" />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Room Code</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="form-control text-center font-monospace fs-5"
              style={{ letterSpacing: "0.2em" }}
              placeholder="ABCD12"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className="btn btn-success w-100 py-2"
          >
            {isLoading ? "Joining..." : "Join Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
