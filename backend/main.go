package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"google.golang.org/genai"

	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/model/gemini"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/geminitool"
)

const (
	appName   = "valzu-chat"
	modelName = "gemini-2.5-flash"
	agentName = "current_events_agent"
)

type server struct {
	runner         *runner.Runner
	sessionService session.Service
}

func main() {
	ctx := context.Background()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	if os.Getenv("GOOGLE_CLOUD_PROJECT") != "" && os.Getenv("GOOGLE_GENAI_USE_VERTEXAI") == "" {
		_ = os.Setenv("GOOGLE_GENAI_USE_VERTEXAI", "True")
	}
	if os.Getenv("GOOGLE_CLOUD_LOCATION") == "" {
		_ = os.Setenv("GOOGLE_CLOUD_LOCATION", "europe-west1")
	}

	model, err := gemini.NewModel(ctx, modelName, &genai.ClientConfig{})
	if err != nil {
		slog.Error("failed to create model", "error", err)
		os.Exit(1)
	}

	rootAgent, err := llmagent.New(llmagent.Config{
		Name:        agentName,
		Model:       model,
		Description: "Agent that answers questions about current events using Google Search.",
		Instruction: "You are a helpful assistant that answers questions about current events and news. Use Google Search when you need up-to-date information. Be concise and cite sources when available.",
		Tools: []tool.Tool{
			geminitool.GoogleSearch{},
		},
	})
	if err != nil {
		slog.Error("failed to create agent", "error", err)
		os.Exit(1)
	}

	sessionService := session.InMemoryService()

	r, err := runner.New(runner.Config{
		AppName:           appName,
		Agent:             rootAgent,
		SessionService:    sessionService,
		AutoCreateSession: true,
	})
	if err != nil {
		slog.Error("failed to create runner", "error", err)
		os.Exit(1)
	}

	srv := &server{
		runner:         r,
		sessionService: sessionService,
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("POST /stream", srv.streamHandler)

	httpServer := &http.Server{
		Addr:              ":" + port,
		Handler:           requestLogMiddleware(mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	slog.Info("backend starting", "port", port, "model", modelName)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func requestLogMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"latencyMs", time.Since(start).Milliseconds(),
		)
	})
}
