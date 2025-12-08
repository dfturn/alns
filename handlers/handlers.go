package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dfturn/alns/models"
	"github.com/dfturn/alns/service"
	"github.com/gorilla/mux"
)

type Handler struct {
	gameService *service.GameService
}

func NewHandler(gameService *service.GameService) *Handler {
	return &Handler{
		gameService: gameService,
	}
}

// CreateRoomRequest is the request to create a new room
type CreateRoomRequest struct {
	PlayerName string `json:"playerName"`
}

// CreateRoomResponse is the response for creating a room
type CreateRoomResponse struct {
	Room     *models.Room `json:"room"`
	PlayerID string       `json:"playerId"`
}

// JoinRoomRequest is the request to join a room
type JoinRoomRequest struct {
	PlayerName string `json:"playerName"`
}

// JoinRoomResponse is the response for joining a room
type JoinRoomResponse struct {
	Room     *models.Room      `json:"room"`
	Game     *models.GameState `json:"game"`
	PlayerID string            `json:"playerId"`
}

// PlayCardRequest is the request to play a card
type PlayCardRequest struct {
	PlayerID string             `json:"playerId"`
	CardID   int                `json:"cardId"`
	Theater  models.TheaterType `json:"theater"`
	FaceUp   bool               `json:"faceUp"`
}

// WithdrawRequest is the request to withdraw
type WithdrawRequest struct {
	PlayerID string `json:"playerId"`
}

// UpdateScoresRequest is the request to update theater scores
type UpdateScoresRequest struct {
	PlayerID string                     `json:"playerId"`
	Scores   map[models.TheaterType]int `json:"scores"`
}

// EndTurnRequest is the request to end turn
type EndTurnRequest struct {
	PlayerID string `json:"playerId"`
}

// DrawCardRequest is the request to draw a card
type DrawCardRequest struct {
	PlayerID string `json:"playerId"`
}

// ManipulateCardRequest is the request to manipulate a card
type ManipulateCardRequest struct {
	PlayerID string             `json:"playerId"`
	Theater  models.TheaterType `json:"theater"`
	Action   string             `json:"action"` // "flip", "destroy", or "return"
}

// DestroyCardRequest is the request to destroy a card from hand
type DestroyCardRequest struct {
	PlayerID string `json:"playerId"`
	CardID   int    `json:"cardId"`
}

// CreateRoom handles POST /api/rooms
func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	room, err := h.gameService.CreateRoom(req.PlayerName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := CreateRoomResponse{
		Room:     room,
		PlayerID: room.Player1.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// JoinRoom handles POST /api/rooms/:id/join
func (h *Handler) JoinRoom(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roomID := vars["id"]

	var req JoinRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	room, game, err := h.gameService.JoinRoom(roomID, req.PlayerName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp := JoinRoomResponse{
		Room:     room,
		Game:     game,
		PlayerID: room.Player2.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GetRoom handles GET /api/rooms/:id
func (h *Handler) GetRoom(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roomID := vars["id"]

	room, err := h.gameService.GetRoom(roomID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// GetGame handles GET /api/games/:id
func (h *Handler) GetGame(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	game, err := h.gameService.GetGame(gameID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// PlayCard handles POST /api/games/:id/play-card
func (h *Handler) PlayCard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req PlayCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.PlayCard(gameID, req.PlayerID, req.CardID, req.Theater, req.FaceUp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// Withdraw handles POST /api/games/:id/withdraw
func (h *Handler) Withdraw(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req WithdrawRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.Withdraw(gameID, req.PlayerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// UpdateScores handles POST /api/games/:id/update-scores
func (h *Handler) UpdateScores(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req UpdateScoresRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.UpdateTheaterScores(gameID, req.PlayerID, req.Scores)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// StartNextBattle handles POST /api/games/:id/next-battle
func (h *Handler) StartNextBattle(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	game, err := h.gameService.StartNextBattle(gameID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// StartNextGame handles POST /api/games/:id/next-game
func (h *Handler) StartNextGame(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	game, err := h.gameService.StartNextGame(gameID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// EndTurn handles POST /api/games/:id/end-turn
func (h *Handler) EndTurn(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req EndTurnRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.EndTurn(gameID, req.PlayerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// DrawCard handles POST /api/games/:id/draw-card
func (h *Handler) DrawCard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req DrawCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.DrawCard(gameID, req.PlayerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// ManipulateCard handles POST /api/games/:id/manipulate-card
func (h *Handler) ManipulateCard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req ManipulateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.ManipulateCard(gameID, req.PlayerID, req.Theater, req.Action)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// DestroyCard handles POST /api/games/:id/destroy-card
func (h *Handler) DestroyCard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req DestroyCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameService.DestroyCard(gameID, req.PlayerID, req.CardID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(game)
}

// CORS middleware
func (h *Handler) EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
