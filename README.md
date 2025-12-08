# Air, Land & Sea

A web-based implementation of the two-player tactical card game "Air, Land & Sea".

## Project Structure

```
.
├── models/          # Go backend data models
├── service/         # Go backend game logic
├── handlers/        # Go backend HTTP handlers
├── main.go          # Go backend entry point
├── frontend/        # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.ts      # API client
│   │   ├── types.ts    # TypeScript types
│   │   └── App.tsx     # Main app component
│   └── ...
├── Dockerfile       # Multi-stage Docker build
└── README.md
```

## Technology Stack

### Backend

- **Language**: Go
- **Framework**: Gorilla Mux (HTTP routing)
- **Architecture**: RESTful API

### Frontend

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React hooks

## Getting Started

### Prerequisites

- Go 1.21 or higher
- Node.js 20 or higher
- Docker (optional, for containerized deployment)

### Running Locally

#### Backend

```bash
# Install Go dependencies
go mod download

# Run the backend server
go run main.go
```

The backend will start on `http://localhost:8080`.

#### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on `http://localhost:5173`.

You can configure the backend URL by creating a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8080
```

### Running with Docker

Build and run the entire application in a single container:

```bash
# Build the Docker image
docker build -t air-land-sea .

# Run the container
docker run -p 8080:8080 air-land-sea
```

The application will be available at `http://localhost:8080`.

## API Endpoints

### Room Management

- `POST /api/rooms` - Create a new game room
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join an existing room

### Game Operations

- `GET /api/games/:id` - Get current game state
- `POST /api/games/:id/play-card` - Play a card to a theater
- `POST /api/games/:id/withdraw` - Withdraw from the current battle
- `POST /api/games/:id/update-scores` - Submit theater scores
- `POST /api/games/:id/next-battle` - Start the next battle

## Game Rules

### Overview

Air, Land & Sea is a two-player tactical card game where players compete over three theaters (Air, Land, and Sea). Players win by controlling 2 out of 3 theaters in each battle, accumulating Victory Points (VP) until one player reaches 12+ VP.

### Game Components

- 18 cards total (6 per theater)
- Each card has a strength value (1-6) and belongs to one theater
- 3 theaters: Air, Land, and Sea

### Turn Actions

Players alternate turns, choosing one of these actions:

1. **Deploy**: Play a card face-up to its matching theater
2. **Improvise**: Play a card face-down to any theater (counts as strength 2)
3. **Withdraw**: Concede the battle (opponent gets VP based on timing)

### Winning

- Control a theater by having the highest total strength
- Win the battle by controlling 2 of 3 theaters
- Win the game by reaching 12+ Victory Points

## Development

### Backend Structure

- `models/models.go` - Data structures for cards, players, game state
- `service/game_service.go` - Core game logic and state management
- `handlers/handlers.go` - HTTP request handlers
- `main.go` - Server initialization and routing

### Frontend Components

- `RoomLobby.tsx` - Room creation and joining interface
- `GameBoard.tsx` - Main game board layout and logic
- `Card.tsx` - Individual card display
- `Theater.tsx` - Theater display with played cards
- `ScoringModal.tsx` - End-of-battle scoring interface

## Future Enhancements

Currently, card abilities are handled manually by players. Future versions could:

- Implement automated card ability effects
- Add spectator mode
- Include game replay functionality
- Add lobby chat
- Implement matchmaking

## License

This is a fan-made implementation for educational purposes.
