package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/model"
	"google.golang.org/adk/session"
)

type historyMessage struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

type streamRequest struct {
	UserID   string           `json:"userId"`
	ThreadID string           `json:"threadId"`
	Message  string           `json:"message"`
	History  []historyMessage `json:"history"`
}

type sseEvent struct {
	Type    string `json:"type"`
	Text    string `json:"text,omitempty"`
	URL     string `json:"url,omitempty"`
	Title   string `json:"title,omitempty"`
	Message string `json:"message,omitempty"`
}

func (s *server) streamHandler(w http.ResponseWriter, r *http.Request) {
	rc := http.NewResponseController(w)
	_ = rc.SetWriteDeadline(time.Now().Add(120 * time.Second))

	var req streamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.UserID == "" || req.ThreadID == "" || strings.TrimSpace(req.Message) == "" {
		writeJSONError(w, http.StatusBadRequest, "userId, threadId, and message are required")
		return
	}

	ctx := r.Context()
	if err := s.ensureSessionWithHistory(ctx, req.UserID, req.ThreadID, req.History); err != nil {
		slog.Error("session hydration failed", "error", err, "userId", req.UserID, "threadId", req.ThreadID)
		writeJSONError(w, http.StatusInternalServerError, "failed to prepare session")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	_ = rc.Flush()

	userContent := &genai.Content{
		Role:  genai.RoleUser,
		Parts: []*genai.Part{{Text: req.Message}},
	}

	tokensEmitted, err := s.runStream(ctx, rc, w, req.UserID, req.ThreadID, userContent)
	if err != nil {
		_ = writeSSE(rc, w, sseEvent{Type: "error", Message: "Agent run failed"})
		return
	}

	if !tokensEmitted {
		_ = writeSSE(rc, w, sseEvent{Type: "error", Message: "No response from backend"})
		return
	}

	_ = writeSSE(rc, w, sseEvent{Type: "done"})
}

func (s *server) runStream(
	ctx context.Context,
	rc *http.ResponseController,
	w http.ResponseWriter,
	userID, threadID string,
	userContent *genai.Content,
) (tokensEmitted bool, err error) {
	emittedSources := make(map[string]bool)
	searchStatusSent := false
	var streamedLen int
	var finalText string

	for event, runErr := range s.runner.Run(ctx, userID, threadID, userContent, agent.RunConfig{
		StreamingMode: agent.StreamingModeSSE,
	}) {
		if runErr != nil {
			return tokensEmitted, runErr
		}
		if event == nil {
			continue
		}

		if hasFunctionCalls(&event.LLMResponse) && !searchStatusSent {
			searchStatusSent = true
			_ = writeSSE(rc, w, sseEvent{Type: "status", Text: "Searching..."})
		}

		for _, src := range extractSources(&event.LLMResponse) {
			if emittedSources[src.URL] {
				continue
			}
			emittedSources[src.URL] = true
			_ = writeSSE(rc, w, sseEvent{Type: "source", URL: src.URL, Title: src.Title})
		}

		text := extractText(&event.LLMResponse)
		if text == "" {
			continue
		}

		if event.Partial {
			delta := text
			if len(text) > streamedLen {
				delta = text[streamedLen:]
				streamedLen = len(text)
			}
			if delta != "" {
				tokensEmitted = true
				_ = writeSSE(rc, w, sseEvent{Type: "token", Text: delta})
			}
			continue
		}

		if event.IsFinalResponse() {
			finalText = text
		}
	}

	if !tokensEmitted && finalText != "" {
		tokensEmitted = true
		_ = writeSSE(rc, w, sseEvent{Type: "token", Text: finalText})
	}

	return tokensEmitted, nil
}

func (s *server) ensureSessionWithHistory(ctx context.Context, userID, threadID string, history []historyMessage) error {
	getResp, err := s.sessionService.Get(ctx, &session.GetRequest{
		AppName:   appName,
		UserID:    userID,
		SessionID: threadID,
	})

	var sess session.Session
	if err != nil {
		createResp, createErr := s.sessionService.Create(ctx, &session.CreateRequest{
			AppName:   appName,
			UserID:    userID,
			SessionID: threadID,
		})
		if createErr != nil {
			return createErr
		}
		sess = createResp.Session
	} else {
		sess = getResp.Session
	}

	if len(history) == 0 {
		return nil
	}

	eventCount := 0
	for range sess.Events().All() {
		eventCount++
	}
	if eventCount > 0 {
		return nil
	}

	for _, msg := range history {
		if strings.TrimSpace(msg.Text) == "" {
			continue
		}
		role := genai.RoleUser
		author := "user"
		if msg.Role == "assistant" {
			role = genai.RoleModel
			author = agentName
		}
		event := session.NewEvent("hydrate")
		event.Author = author
		event.LLMResponse = model.LLMResponse{
			Content: &genai.Content{
				Role:  role,
				Parts: []*genai.Part{{Text: msg.Text}},
			},
		}
		if err := s.sessionService.AppendEvent(ctx, sess, event); err != nil {
			return err
		}
	}

	return nil
}

type sourceRef struct {
	URL   string
	Title string
}

func extractText(resp *model.LLMResponse) string {
	if resp == nil || resp.Content == nil {
		return ""
	}
	var b strings.Builder
	for _, part := range resp.Content.Parts {
		if part.Text != "" {
			b.WriteString(part.Text)
		}
	}
	return b.String()
}

func extractSources(resp *model.LLMResponse) []sourceRef {
	if resp == nil || resp.GroundingMetadata == nil {
		return nil
	}
	var out []sourceRef
	for _, chunk := range resp.GroundingMetadata.GroundingChunks {
		if chunk.Web != nil && chunk.Web.URI != "" {
			title := chunk.Web.Title
			if title == "" {
				title = chunk.Web.URI
			}
			out = append(out, sourceRef{URL: chunk.Web.URI, Title: title})
		}
	}
	for _, support := range resp.GroundingMetadata.GroundingSupports {
		if support.Segment == nil {
			continue
		}
		for _, idx := range support.GroundingChunkIndices {
			if int(idx) >= len(resp.GroundingMetadata.GroundingChunks) {
				continue
			}
			chunk := resp.GroundingMetadata.GroundingChunks[idx]
			if chunk.Web != nil && chunk.Web.URI != "" {
				title := chunk.Web.Title
				if title == "" {
					title = chunk.Web.URI
				}
				out = append(out, sourceRef{URL: chunk.Web.URI, Title: title})
			}
		}
	}
	return out
}

func hasFunctionCalls(resp *model.LLMResponse) bool {
	if resp == nil || resp.Content == nil {
		return false
	}
	for _, part := range resp.Content.Parts {
		if part.FunctionCall != nil {
			return true
		}
	}
	return false
}

func writeSSE(rc *http.ResponseController, w http.ResponseWriter, event sseEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
		return err
	}
	return rc.Flush()
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
