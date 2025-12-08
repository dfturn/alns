package models

// TheaterType represents the three theaters in the game
type TheaterType string

const (
	Air  TheaterType = "air"
	Land TheaterType = "land"
	Sea  TheaterType = "sea"
)

// Card represents a single game card
type Card struct {
	ID       int         `json:"id"`       // 1-18
	Theater  TheaterType `json:"theater"`  // Air, Land, or Sea
	Strength int         `json:"strength"` // 0-6
	Name     string      `json:"name"`     // Card name for reference
}

// PlayedCard represents a card that has been played to a theater
type PlayedCard struct {
	Card     Card   `json:"card"`
	FaceUp   bool   `json:"faceUp"`
	PlayerID string `json:"playerId"`
}

// Theater represents one of the three battle theaters
type Theater struct {
	Type  TheaterType  `json:"type"`
	Cards []PlayedCard `json:"cards"`
}

// Player represents a player in the game
type Player struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Hand  []Card `json:"hand"`
	Score int    `json:"score"` // Victory Points
}

// TheaterScore represents the strength totals for a theater
type TheaterScore struct {
	Player1Total int `json:"player1Total"`
	Player2Total int `json:"player2Total"`
}

// GameState represents the current state of a game
type GameState struct {
	ID               string                        `json:"id"`
	RoomID           string                        `json:"roomId"`
	Player1          Player                        `json:"player1"`
	Player2          Player                        `json:"player2"`
	Deck             []Card                        `json:"deck"` // Remaining undealt cards
	Trash            []Card                        `json:"trash"`
	TheaterOrder     []TheaterType                 `json:"theaterOrder"`
	Theaters         map[TheaterType]*Theater      `json:"theaters"`
	CurrentPlayerID  string                        `json:"currentPlayerId"`
	Phase            GamePhase                     `json:"phase"`
	BattleNumber     int                           `json:"battleNumber"`
	FirstPlayerID    string                        `json:"firstPlayerId"` // Who went first this battle
	WithdrewPlayerID string                        `json:"withdrewPlayerId,omitempty"`
	TheaterScores    map[TheaterType]*TheaterScore `json:"theaterScores,omitempty"`
}

// GamePhase represents the current phase of the game
type GamePhase string

const (
	PhaseWaitingForPlayers GamePhase = "waiting"
	PhasePlaying           GamePhase = "playing"
	PhaseScoring           GamePhase = "scoring"
	PhaseGameOver          GamePhase = "game_over"
)

// Room represents a game room that players can join
type Room struct {
	ID      string     `json:"id"`
	Player1 *Player    `json:"player1,omitempty"`
	Player2 *Player    `json:"player2,omitempty"`
	GameID  string     `json:"gameId,omitempty"`
	Status  RoomStatus `json:"status"`
}

// RoomStatus represents the status of a room
type RoomStatus string

const (
	RoomStatusWaiting RoomStatus = "waiting"
	RoomStatusFull    RoomStatus = "full"
	RoomStatusPlaying RoomStatus = "playing"
)

// AllCards returns all 18 cards in the game
func AllCards() []Card {
	return []Card{
		// Air Cards (1-6)
		{ID: 1, Theater: Air, Strength: 1, Name: "Air Drop"},
		{ID: 2, Theater: Air, Strength: 2, Name: "Air Superiority"},
		{ID: 3, Theater: Air, Strength: 3, Name: "Aerodrome"},
		{ID: 4, Theater: Air, Strength: 4, Name: "Maneuver"},
		{ID: 5, Theater: Air, Strength: 5, Name: "Transport"},
		{ID: 6, Theater: Air, Strength: 6, Name: "Heavy Bombers"},

		// Land Cards (7-12)
		{ID: 7, Theater: Land, Strength: 1, Name: "Ambush"},
		{ID: 8, Theater: Land, Strength: 2, Name: "Reconnaissance"},
		{ID: 9, Theater: Land, Strength: 3, Name: "Support"},
		{ID: 10, Theater: Land, Strength: 4, Name: "Reinforce"},
		{ID: 11, Theater: Land, Strength: 5, Name: "Armor"},
		{ID: 12, Theater: Land, Strength: 6, Name: "Heavy Tanks"},

		// Sea Cards (13-18)
		{ID: 13, Theater: Sea, Strength: 1, Name: "Disrupt"},
		{ID: 14, Theater: Sea, Strength: 2, Name: "Naval Superiority"},
		{ID: 15, Theater: Sea, Strength: 3, Name: "Redeploy"},
		{ID: 16, Theater: Sea, Strength: 4, Name: "Escalation"},
		{ID: 17, Theater: Sea, Strength: 5, Name: "Containment"},
		{ID: 18, Theater: Sea, Strength: 6, Name: "Blockade"},
	}
}
