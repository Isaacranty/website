package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type Response map[string]interface{}

var token = "GO_SECRET_TOKEN"
var notes = []map[string]string{}

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s %dms", r.Method, r.RequestURI, r.RemoteAddr, time.Since(start).Milliseconds())
	})
}

func checkAuth(r *http.Request) bool {
	auth := r.Header.Get("Authorization")
	if auth == "" || len(auth) < 8 || auth[:7] != "Bearer " {
		return false
	}
	return auth[7:] == token
}

func handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(Response{"error": "invalid json"})
		return
	}
	if body.Username == "admin" && body.Password == "admin" {
		json.NewEncoder(w).Encode(Response{"token": token})
		return
	}
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(Response{"error": "invalid credentials"})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{"status": "go up", "timestamp": time.Now().UTC().Format(time.RFC3339)})
}

func handleEcho(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if !checkAuth(r) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(Response{"error": "unauthorized"})
		return
	}
	var body struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(Response{"error": "invalid json"})
		return
	}
	notes = append(notes, map[string]string{"message": body.Message, "created_at": time.Now().UTC().Format(time.RFC3339)})
	json.NewEncoder(w).Encode(Response{"engine": "go", "message": body.Message, "echoed": time.Now().UTC().Format(time.RFC3339)})
}

func handleNotes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if !checkAuth(r) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(Response{"error": "unauthorized"})
		return
	}
	json.NewEncoder(w).Encode(Response{"notes": notes})
}

func handleQuote(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{"engine": "go", "quote": "Go is expressive, concise, clean, and efficient."})
}

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "go_uptime_seconds %d\n", int(time.Now().Unix()))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/status", handleStatus)
	mux.HandleFunc("/auth/login", handleAuthLogin)
	mux.HandleFunc("/echo", handleEcho)
	mux.HandleFunc("/notes", handleNotes)
	mux.HandleFunc("/quote", handleQuote)
	mux.HandleFunc("/metrics", handleMetrics)

	log.Println("Go API running at http://localhost:8081")
	if err := http.ListenAndServe(":8081", logging(mux)); err != nil {
		log.Fatal(err)
	}
}
