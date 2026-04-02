package main

import (
	"net/http"
	"testing"
	"time"
)

func TestStatus(t *testing.T) {
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("http://localhost:8081/status")
	if err != nil {
		t.Fatalf("failed to call status: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}
