package service

import (
	"errors"
	"math/rand"
	"sync"
	"time"

	"github.com/dfturn/alns/models"
	"github.com/google/uuid"
)

// GameService handles game logic and state management
type GameService struct {
	rooms sync.Map // map[string]*models.Room
	games sync.Map // map[string]*models.GameState
	rand  *rand.Rand
}

// NewGameService creates a new game service
func NewGameService() *GameService {
	return &GameService{
		rand: rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// generateRoomCode generates a 6-character alphanumeric room code
func (s *GameService) generateRoomCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	code := make([]byte, 6)
	for i := range code {
		code[i] = charset[s.rand.Intn(len(charset))]
	}
	return string(code)
}

// CreateRoom creates a new room for players to join
func (s *GameService) CreateRoom(playerName string) (*models.Room, error) {
	// Generate unique room code
	var roomID string
	for {
		roomID = s.generateRoomCode()
		if _, exists := s.rooms.Load(roomID); !exists {
			break
		}
	}

	playerID := uuid.New().String()

	player := &models.Player{
		ID:    playerID,
		Name:  playerName,
		Hand:  []models.Card{},
		Score: 0,
	}

	room := &models.Room{
		ID:      roomID,
		Player1: player,
		Status:  models.RoomStatusWaiting,
	}

	s.rooms.Store(roomID, room)
	return room, nil
}

// JoinRoom allows a second player to join an existing room
func (s *GameService) JoinRoom(roomID, playerName string) (*models.Room, *models.GameState, error) {
	value, ok := s.rooms.Load(roomID)
	if !ok {
		return nil, nil, errors.New("room not found")
	}

	room := value.(*models.Room)
	if room.Status != models.RoomStatusWaiting {
		return nil, nil, errors.New("room is not available")
	}

	playerID := uuid.New().String()
	player := &models.Player{
		ID:    playerID,
		Name:  playerName,
		Hand:  []models.Card{},
		Score: 0,
	}

	room.Player2 = player
	room.Status = models.RoomStatusFull

	// Start the game
	game, err := s.startNewGame(room)
	if err != nil {
		return nil, nil, err
	}

	room.GameID = game.ID
	room.Status = models.RoomStatusPlaying
	s.rooms.Store(roomID, room)

	return room, game, nil
}

// GetRoom retrieves a room by ID
func (s *GameService) GetRoom(roomID string) (*models.Room, error) {
	value, ok := s.rooms.Load(roomID)
	if !ok {
		return nil, errors.New("room not found")
	}
	return value.(*models.Room), nil
}

// GetGame retrieves a game by ID
func (s *GameService) GetGame(gameID string) (*models.GameState, error) {
	value, ok := s.games.Load(gameID)
	if !ok {
		return nil, errors.New("game not found")
	}
	return value.(*models.GameState), nil
}

// startNewGame initializes a new game
func (s *GameService) startNewGame(room *models.Room) (*models.GameState, error) {
	gameID := uuid.New().String()

	// Randomly choose first player
	firstPlayerID := room.Player1.ID
	if s.rand.Intn(2) == 1 {
		firstPlayerID = room.Player2.ID
	}

	// Shuffle and deal cards
	deck := s.shuffleDeck(models.AllCards())
	player1Hand := deck[:6]
	player2Hand := deck[6:12]
	remainingDeck := deck[12:]

	game := &models.GameState{
		ID:     gameID,
		RoomID: room.ID,
		Player1: models.Player{
			ID:    room.Player1.ID,
			Name:  room.Player1.Name,
			Hand:  player1Hand,
			Score: 0,
		},
		Player2: models.Player{
			ID:    room.Player2.ID,
			Name:  room.Player2.Name,
			Hand:  player2Hand,
			Score: 0,
		},
		Deck:            remainingDeck,
		Trash:           []models.Card{},
		TheaterOrder:    []models.TheaterType{models.Air, models.Land, models.Sea},
		CurrentPlayerID: firstPlayerID,
		FirstPlayerID:   firstPlayerID,
		Phase:           models.PhasePlaying,
		BattleNumber:    1,
		Theaters: map[models.TheaterType]*models.Theater{
			models.Air:  {Type: models.Air, Cards: []models.PlayedCard{}},
			models.Land: {Type: models.Land, Cards: []models.PlayedCard{}},
			models.Sea:  {Type: models.Sea, Cards: []models.PlayedCard{}},
		},
	}

	s.games.Store(gameID, game)
	return game, nil
}

// shuffleDeck shuffles a deck of cards
func (s *GameService) shuffleDeck(cards []models.Card) []models.Card {
	shuffled := make([]models.Card, len(cards))
	copy(shuffled, cards)

	s.rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	return shuffled
}

// PlayCard plays a card from a player's hand to a theater
func (s *GameService) PlayCard(gameID, playerID string, cardID int, theater models.TheaterType, faceUp bool) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhasePlaying {
		return nil, errors.New("game is not in playing phase")
	}

	if game.CurrentPlayerID != playerID {
		return nil, errors.New("not your turn")
	}

	// Find and remove card from player's hand
	var player *models.Player
	if game.Player1.ID == playerID {
		player = &game.Player1
	} else {
		player = &game.Player2
	}

	cardIndex := -1
	var card models.Card
	for i, c := range player.Hand {
		if c.ID == cardID {
			cardIndex = i
			card = c
			break
		}
	}

	if cardIndex == -1 {
		return nil, errors.New("card not in hand")
	}

	// Remove card from hand
	player.Hand = append(player.Hand[:cardIndex], player.Hand[cardIndex+1:]...)

	// Add card to theater
	playedCard := models.PlayedCard{
		Card:     card,
		FaceUp:   faceUp,
		PlayerID: playerID,
	}

	theaterObj := game.Theaters[theater]
	theaterObj.Cards = append(theaterObj.Cards, playedCard)

	// Don't switch turns - player must explicitly end turn

	// Update the player in the game state
	if game.Player1.ID == playerID {
		game.Player1 = *player
	} else {
		game.Player2 = *player
	}

	// Check if both players are out of cards
	if len(game.Player1.Hand) == 0 && len(game.Player2.Hand) == 0 {
		game.Phase = models.PhaseScoring
		game.TheaterScores = make(map[models.TheaterType]*models.TheaterScore)
	}

	s.games.Store(gameID, game)
	return game, nil
}

// EndTurn ends the current player's turn
func (s *GameService) EndTurn(gameID, playerID string) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhasePlaying {
		return nil, errors.New("game is not in playing phase")
	}

	if game.CurrentPlayerID != playerID {
		return nil, errors.New("not your turn")
	}

	// Switch to other player
	if game.CurrentPlayerID == game.Player1.ID {
		game.CurrentPlayerID = game.Player2.ID
	} else {
		game.CurrentPlayerID = game.Player1.ID
	}

	s.games.Store(gameID, game)
	return game, nil
}

// DrawCard draws one card from the deck
func (s *GameService) DrawCard(gameID, playerID string) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhasePlaying {
		return nil, errors.New("game is not in playing phase")
	}

	if game.CurrentPlayerID != playerID {
		return nil, errors.New("not your turn")
	}

	if len(game.Deck) == 0 {
		return nil, errors.New("no cards left in deck")
	}

	// Draw top card from deck
	card := game.Deck[0]
	game.Deck = game.Deck[1:]

	// Add to player's hand
	if game.Player1.ID == playerID {
		game.Player1.Hand = append(game.Player1.Hand, card)
	} else {
		game.Player2.Hand = append(game.Player2.Hand, card)
	}

	s.games.Store(gameID, game)
	return game, nil
}

// ManipulateCard allows flipping, destroying, or returning a card to hand
func (s *GameService) ManipulateCard(gameID, playerID string, theater models.TheaterType, cardID int, action string) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhasePlaying {
		return nil, errors.New("game is not in playing phase")
	}

	if game.CurrentPlayerID != playerID {
		return nil, errors.New("not your turn")
	}

	theaterObj := game.Theaters[theater]
	if len(theaterObj.Cards) == 0 {
		return nil, errors.New("no cards in this theater")
	}

	// Determine target card
	targetIndex := -1
	var targetCard *models.PlayedCard
	if cardID != 0 {
		for i := len(theaterObj.Cards) - 1; i >= 0; i-- {
			if theaterObj.Cards[i].Card.ID == cardID {
				targetIndex = i
				targetCard = &theaterObj.Cards[i]
				break
			}
		}
		if targetIndex == -1 {
			return nil, errors.New("card not found in theater")
		}

		// Ensure the selected card is the top card for that player
		for i := len(theaterObj.Cards) - 1; i > targetIndex; i-- {
			if theaterObj.Cards[i].PlayerID == targetCard.PlayerID {
				return nil, errors.New("card is not the top of that player's stack")
			}
		}
	} else {
		targetIndex = len(theaterObj.Cards) - 1
		targetCard = &theaterObj.Cards[targetIndex]
	}

	switch action {
	case "flip":
		// Flip the card
		targetCard.FaceUp = !targetCard.FaceUp

	case "destroy":
		destroyed := *targetCard
		// Remove the card from theater
		theaterObj.Cards = append(theaterObj.Cards[:targetIndex], theaterObj.Cards[targetIndex+1:]...)
		game.Trash = append(game.Trash, destroyed.Card)

	case "return":
		// Return card to owner's hand
		card := targetCard.Card
		theaterObj.Cards = append(theaterObj.Cards[:targetIndex], theaterObj.Cards[targetIndex+1:]...)

		// Add back to owner's hand
		if targetCard.PlayerID == game.Player1.ID {
			game.Player1.Hand = append(game.Player1.Hand, card)
		} else {
			game.Player2.Hand = append(game.Player2.Hand, card)
		}

	default:
		return nil, errors.New("invalid action")
	}

	s.games.Store(gameID, game)
	return game, nil
}

// DestroyCard removes a card from the current player's hand and places it in the trash
func (s *GameService) DestroyCard(gameID, playerID string, cardID int) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhasePlaying {
		return nil, errors.New("game is not in playing phase")
	}

	if game.CurrentPlayerID != playerID {
		return nil, errors.New("not your turn")
	}

	var player *models.Player
	if game.Player1.ID == playerID {
		player = &game.Player1
	} else {
		player = &game.Player2
	}

	index := -1
	for i, c := range player.Hand {
		if c.ID == cardID {
			index = i
			break
		}
	}

	if index == -1 {
		return nil, errors.New("card not in hand")
	}

	destroyedCard := player.Hand[index]
	player.Hand = append(player.Hand[:index], player.Hand[index+1:]...)
	game.Trash = append(game.Trash, destroyedCard)

	if game.Player1.ID == playerID {
		game.Player1 = *player
	} else {
		game.Player2 = *player
	}

	if len(game.Player1.Hand) == 0 && len(game.Player2.Hand) == 0 {
		game.Phase = models.PhaseScoring
		game.TheaterScores = make(map[models.TheaterType]*models.TheaterScore)
	}

	s.games.Store(gameID, game)
	return game, nil
}

// Withdraw allows a player to withdraw from the current battle
func (s *GameService) Withdraw(gameID, playerID string) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhasePlaying {
		return nil, errors.New("cannot withdraw in current phase")
	}

	game.WithdrewPlayerID = playerID
	game.Phase = models.PhaseScoring

	// Calculate VP for opponent based on withdrawal rules
	var cardsRemaining int
	if playerID == game.Player1.ID {
		cardsRemaining = len(game.Player1.Hand)
	} else {
		cardsRemaining = len(game.Player2.Hand)
	}

	isFirstPlayer := playerID == game.FirstPlayerID
	vpAwarded := s.calculateWithdrawalVP(isFirstPlayer, cardsRemaining)

	// Award VP to opponent
	if playerID == game.Player1.ID {
		game.Player2.Score += vpAwarded
	} else {
		game.Player1.Score += vpAwarded
	}

	// Check for game over
	if game.Player1.Score >= 12 || game.Player2.Score >= 12 {
		game.Phase = models.PhaseGameOver
	}

	s.games.Store(gameID, game)
	return game, nil
}

// calculateWithdrawalVP calculates VP awarded when a player withdraws
func (s *GameService) calculateWithdrawalVP(isFirstPlayer bool, cardsRemaining int) int {
	if isFirstPlayer {
		switch {
		case cardsRemaining >= 4:
			return 2
		case cardsRemaining >= 2:
			return 3
		case cardsRemaining == 1:
			return 4
		default:
			return 6
		}
	}

	switch {
	case cardsRemaining >= 5:
		return 2
	case cardsRemaining >= 3:
		return 3
	case cardsRemaining == 2:
		return 4
	default:
		return 6
	}
}

// UpdateTheaterScores updates the theater scores submitted by players
func (s *GameService) UpdateTheaterScores(gameID, playerID string, scores map[models.TheaterType]int) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhaseScoring {
		return nil, errors.New("game is not in scoring phase")
	}

	// If someone withdrew, we don't need manual scoring
	if game.WithdrewPlayerID != "" {
		return game, nil
	}

	// Initialize theater scores if needed
	if game.TheaterScores == nil {
		game.TheaterScores = make(map[models.TheaterType]*models.TheaterScore)
	}

	// Update scores for each theater
	for theater, score := range scores {
		if game.TheaterScores[theater] == nil {
			game.TheaterScores[theater] = &models.TheaterScore{}
		}

		if playerID == game.Player1.ID {
			game.TheaterScores[theater].Player1Total = score
		} else {
			game.TheaterScores[theater].Player2Total = score
		}
	}

	// Check if both players have submitted scores
	allScored := true
	for _, theater := range []models.TheaterType{models.Air, models.Land, models.Sea} {
		if game.TheaterScores[theater] == nil ||
			game.TheaterScores[theater].Player1Total == 0 && game.TheaterScores[theater].Player2Total == 0 {
			allScored = false
			break
		}
	}

	// If both players scored, calculate winner
	if allScored {
		s.calculateBattleWinner(game)
	}

	s.games.Store(gameID, game)
	return game, nil
}

// calculateBattleWinner determines the winner of a battle and awards VP
func (s *GameService) calculateBattleWinner(game *models.GameState) {
	player1Wins := 0
	player2Wins := 0

	for _, theater := range []models.TheaterType{models.Air, models.Land, models.Sea} {
		score := game.TheaterScores[theater]
		if score.Player1Total > score.Player2Total {
			player1Wins++
		} else if score.Player2Total > score.Player1Total {
			player2Wins++
		}
	}

	// Award 6 VP to winner
	if player1Wins >= 2 {
		game.Player1.Score += 6
	} else if player2Wins >= 2 {
		game.Player2.Score += 6
	}

	// Check for game over
	if game.Player1.Score >= 12 || game.Player2.Score >= 12 {
		game.Phase = models.PhaseGameOver
	}
}

func rotateTheaterOrder(order []models.TheaterType) []models.TheaterType {
	if len(order) == 0 {
		return []models.TheaterType{models.Air, models.Land, models.Sea}
	}

	rotated := make([]models.TheaterType, len(order))
	rotated[0] = order[len(order)-1]
	copy(rotated[1:], order[:len(order)-1])
	return rotated
}

func (s *GameService) setupNextBattle(game *models.GameState) {
	if len(game.TheaterOrder) == 0 {
		game.TheaterOrder = []models.TheaterType{models.Air, models.Land, models.Sea}
	}

	game.TheaterOrder = rotateTheaterOrder(game.TheaterOrder)

	if game.FirstPlayerID == game.Player1.ID {
		game.FirstPlayerID = game.Player2.ID
	} else {
		game.FirstPlayerID = game.Player1.ID
	}

	deck := s.shuffleDeck(models.AllCards())
	game.Player1.Hand = deck[:6]
	game.Player2.Hand = deck[6:12]
	game.Deck = deck[12:]

	game.Theaters = map[models.TheaterType]*models.Theater{
		models.Air:  {Type: models.Air, Cards: []models.PlayedCard{}},
		models.Land: {Type: models.Land, Cards: []models.PlayedCard{}},
		models.Sea:  {Type: models.Sea, Cards: []models.PlayedCard{}},
	}

	game.Trash = []models.Card{}
	game.CurrentPlayerID = game.FirstPlayerID
	game.Phase = models.PhasePlaying
	game.BattleNumber++
	game.WithdrewPlayerID = ""
	game.TheaterScores = nil
}

// StartNextBattle sets up the next battle
func (s *GameService) StartNextBattle(gameID string) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase == models.PhaseGameOver {
		return nil, errors.New("game is over")
	}

	if game.Phase != models.PhaseScoring {
		return nil, errors.New("battle is not finished")
	}

	s.setupNextBattle(game)

	s.games.Store(gameID, game)
	return game, nil
}

// StartNextGame resets the game after it has ended
func (s *GameService) StartNextGame(gameID string) (*models.GameState, error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	if game.Phase != models.PhaseGameOver {
		return nil, errors.New("game is not over")
	}

	// Reset scores and theater order
	game.Player1.Score = 0
	game.Player2.Score = 0
	game.TheaterOrder = []models.TheaterType{models.Air, models.Land, models.Sea}
	game.TheaterScores = nil
	game.WithdrewPlayerID = ""

	// Alternate first player for the new game
	if game.FirstPlayerID == game.Player1.ID {
		game.FirstPlayerID = game.Player2.ID
	} else {
		game.FirstPlayerID = game.Player1.ID
	}

	deck := s.shuffleDeck(models.AllCards())
	game.Player1.Hand = deck[:6]
	game.Player2.Hand = deck[6:12]
	game.Deck = deck[12:]

	game.Theaters = map[models.TheaterType]*models.Theater{
		models.Air:  {Type: models.Air, Cards: []models.PlayedCard{}},
		models.Land: {Type: models.Land, Cards: []models.PlayedCard{}},
		models.Sea:  {Type: models.Sea, Cards: []models.PlayedCard{}},
	}

	game.Trash = []models.Card{}
	game.CurrentPlayerID = game.FirstPlayerID
	game.Phase = models.PhasePlaying
	game.BattleNumber = 1

	s.games.Store(gameID, game)
	return game, nil
}
