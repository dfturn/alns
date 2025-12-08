package main

import (
	"log"
	"net/http"
	"os"

	"github.com/dfturn/alns/handlers"
	"github.com/dfturn/alns/service"
	"github.com/gorilla/mux"
)

func main() {
	// Initialize service
	gameService := service.NewGameService()
	handler := handlers.NewHandler(gameService)

	// Setup router
	r := mux.NewRouter()

	// API routes
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/rooms", handler.CreateRoom).Methods("POST")
	api.HandleFunc("/rooms/{id}", handler.GetRoom).Methods("GET")
	api.HandleFunc("/rooms/{id}/join", handler.JoinRoom).Methods("POST")
	api.HandleFunc("/games/{id}", handler.GetGame).Methods("GET")
	api.HandleFunc("/games/{id}/play-card", handler.PlayCard).Methods("POST")
	api.HandleFunc("/games/{id}/end-turn", handler.EndTurn).Methods("POST")
	api.HandleFunc("/games/{id}/draw-card", handler.DrawCard).Methods("POST")
	api.HandleFunc("/games/{id}/manipulate-card", handler.ManipulateCard).Methods("POST")
	api.HandleFunc("/games/{id}/destroy-card", handler.DestroyCard).Methods("POST")
	api.HandleFunc("/games/{id}/withdraw", handler.Withdraw).Methods("POST")
	api.HandleFunc("/games/{id}/update-scores", handler.UpdateScores).Methods("POST")
	api.HandleFunc("/games/{id}/next-battle", handler.StartNextBattle).Methods("POST")
	api.HandleFunc("/games/{id}/next-game", handler.StartNextGame).Methods("POST")

	// Serve static files from frontend build
	staticDir := "./frontend/dist"
	if _, err := os.Stat(staticDir); err == nil {
		r.PathPrefix("/").Handler(http.FileServer(http.Dir(staticDir)))
	}

	// Enable CORS
	corsRouter := handler.EnableCORS(r)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, corsRouter); err != nil {
		log.Fatal(err)
	}
}
