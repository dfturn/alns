# Development Tips

## Running the Application

### Option 1: Separate Terminals (Recommended for Development)

This gives you full visibility of logs from both frontend and backend.

**Terminal 1 - Backend:**

```bash
go run main.go
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Option 2: Using the Start Script

```bash
./start.sh
```

Press `Ctrl+C` to stop both servers.

## Testing with Two Players

### Option A: Two Browser Windows

1. Open `http://localhost:5173` in two separate browser windows
2. In Window 1: Create a room
3. Copy the room ID
4. In Window 2: Join using the room ID

### Option B: Two Different Browsers

Use Chrome and Firefox (or Safari) to test different player perspectives simultaneously.

### Option C: Incognito Mode

Use a regular window for Player 1 and an incognito window for Player 2.

## Hot Reload

### Frontend

- Vite provides instant hot reload
- Changes to `.tsx`, `.ts`, and `.css` files reload automatically
- No need to restart the dev server

### Backend

- Go doesn't have built-in hot reload
- Install `air` for automatic reloading:
  ```bash
  go install github.com/cosmtrek/air@latest
  air
  ```
- Or manually restart after changes: Press `Ctrl+C` then `go run main.go`

## Debugging

### Backend Debugging

Add print statements:

```go
log.Printf("Debug: player1 hand: %+v", game.Player1.Hand)
```

Or use VS Code's Go debugger:

1. Set breakpoints in `.go` files
2. Press F5 or use the Run panel

### Frontend Debugging

- Use browser DevTools (F12)
- React DevTools extension
- Check Console for errors
- Network tab for API calls
- Add `console.log()` statements

### API Testing

Test endpoints with curl:

```bash
# Create room
curl -X POST http://localhost:8080/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Test"}'

# Join room (replace ROOM_ID)
curl -X POST http://localhost:8080/api/rooms/ROOM_ID/join \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Player2"}'

# Get game state (replace GAME_ID)
curl http://localhost:8080/api/games/GAME_ID
```

## Common Issues

### Port Already in Use

**Backend (8080):**

```bash
# Find process
lsof -i :8080
# Kill process
kill -9 <PID>
```

**Frontend (5173):**

```bash
# Find process
lsof -i :5173
# Kill process
kill -9 <PID>
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:8080/api/rooms`
2. Verify CORS is enabled (it is by default)
3. Check `frontend/.env` has correct `VITE_API_URL`
4. Restart frontend after changing `.env`

### Go Module Issues

```bash
go mod tidy
go mod download
```

### Frontend Build Issues

```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

## Code Organization Tips

### Adding New API Endpoints

1. **Add handler function** in `handlers/handlers.go`:

   ```go
   func (h *Handler) NewEndpoint(w http.ResponseWriter, r *http.Request) {
       // Implementation
   }
   ```

2. **Register route** in `main.go`:

   ```go
   api.HandleFunc("/new-endpoint", handler.NewEndpoint).Methods("POST")
   ```

3. **Add frontend method** in `frontend/src/api.ts`:
   ```typescript
   async newEndpoint(): Promise<Response> {
       return await fetch(`${this.baseUrl}/api/new-endpoint`, {
           method: 'POST'
       });
   }
   ```

### Adding New Components

1. Create file in `frontend/src/components/NewComponent.tsx`
2. Import where needed: `import NewComponent from './components/NewComponent'`
3. Use TypeScript interfaces from `types.ts`

### Modifying Game Logic

Core game logic is in `service/game_service.go`:

- `PlayCard()` - Card playing logic
- `Withdraw()` - Withdrawal and VP calculation
- `UpdateTheaterScores()` - Manual scoring
- `calculateBattleWinner()` - Win condition
- `StartNextBattle()` - Battle reset

## Performance

### Current Polling Interval

Frontend polls every 2 seconds. Adjust in `GameBoard.tsx`:

```typescript
const interval = setInterval(loadGame, 2000); // 2 seconds
```

### Reducing Latency

Consider implementing WebSocket for real-time updates instead of polling.

## Building for Production

### Full Build

```bash
# Build everything
cd frontend && npm run build && cd ..
go build -o server .
```

### Docker Build

```bash
docker build -t air-land-sea .
docker run -p 8080:8080 air-land-sea
```

### Environment Variables

Production `.env` example:

```env
VITE_API_URL=https://your-domain.com
```

## Git Workflow

### Recommended .gitignore (already included)

- `go.sum` (auto-generated)
- `frontend/node_modules/`
- `frontend/dist/`
- `server` (compiled binary)
- `.env.local`

### Committing Changes

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

## Extending the Game

### Adding Card Abilities

Edit `service/game_service.go` in the `PlayCard()` method to add automated card effect logic based on `card.ID`.

### Adding New Game Modes

Create new game service methods and corresponding API endpoints for variants like:

- Best of 3 rounds
- Different VP targets
- Custom card decks

### Styling Changes

Edit component `.tsx` files - Tailwind classes are inline in the JSX.

## Monitoring

### Check Server Health

```bash
curl http://localhost:8080/api/rooms
# Should return empty array or existing rooms
```

### View Logs

Backend logs appear in the terminal running `go run main.go`.
Frontend logs appear in browser DevTools Console.

## Resources

- [Go Documentation](https://go.dev/doc/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Gorilla Mux](https://github.com/gorilla/mux)
