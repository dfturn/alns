# Quick Start Guide - Air, Land & Sea

## Option 1: Run with Separate Frontend and Backend (Development)

### Terminal 1 - Start Backend

```bash
go run main.go
```

The backend will start on `http://localhost:8080`

### Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

Then open `http://localhost:5173` in two different browser windows or tabs to play.

## Option 2: Use the Start Script (Recommended for Development)

```bash
./start.sh
```

This will start both the backend and frontend automatically. Press Ctrl+C to stop both servers.

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`

## Option 3: Run with Docker (Production)

### Build and run the Docker container:

```bash
./docker-run.sh
```

Or manually:

```bash
docker build -t air-land-sea .
docker run -p 8080:8080 air-land-sea
```

Then open `http://localhost:8080` in your browser. The frontend is served by the Go backend.

## How to Play

1. **Create a Room**: Player 1 opens the app, enters their name, and clicks "Create New Room"
2. **Share Room ID**: Player 1 copies the room ID and shares it with Player 2
3. **Join the Room**: Player 2 enters their name and the room ID, then clicks "Join Room"
4. **Game Starts**: The game automatically begins when both players are in the room

### During Your Turn:

1. Click a card in your hand
2. Choose to play it face-up (shows strength and theater) or face-down (strength 2, any theater)
3. Click the theater where you want to play it
4. Or click "Withdraw" to end the battle early

### End of Battle:

- If both players run out of cards, each player enters the total strength in each theater
- The player who controls 2 out of 3 theaters wins the battle and gets 6 VP
- First player to reach 12 VP wins the game!

## Notes

- Card abilities are handled manually by players (following the physical game rules)
- The game polls for updates every 2 seconds, so both players see changes shortly after they happen
- Each battle uses a fresh deck of 18 cards
- The first player alternates between battles

## Troubleshooting

### Backend won't start

- Make sure port 8080 is not in use
- Run `go mod download` to ensure dependencies are installed

### Frontend won't start

- Make sure port 5173 is not in use
- Run `npm install` in the `frontend` directory
- Check that `.env` file exists in `frontend/` with `VITE_API_URL=http://localhost:8080`

### Can't connect to backend from frontend

- Check that both servers are running
- Verify the `VITE_API_URL` in `frontend/.env` matches where your backend is running
- Check browser console for CORS errors

### Docker build fails

- Make sure Docker is installed and running
- Make sure you've run `npm install` in frontend/ first
