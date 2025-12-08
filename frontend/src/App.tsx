import { useState } from "react";
import RoomLobby from "./components/RoomLobby";
import GameBoard from "./components/GameBoard";

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleGameStart = (
    newGameId: string,
    newPlayerId: string,
    newRoomId: string
  ) => {
    setGameId(newGameId);
    setPlayerId(newPlayerId);
    setRoomId(newRoomId);
  };

  if (gameId && playerId && roomId) {
    return <GameBoard gameId={gameId} playerId={playerId} roomId={roomId} />;
  }

  return <RoomLobby onGameStart={handleGameStart} />;
}

export default App;
