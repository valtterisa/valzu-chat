"use client";

import { useCallback, useRef, useState } from "react";
import { getAnonymousUserId } from "@/lib/anonymous-user";
import type { MessageSource, ThreadMessage } from "@/lib/messages";
import type { SSEEvent } from "@/lib/sse";

export type ChatStatus = "ready" | "streaming" | "error";

export function useStreamChat(threadId: string, initialMessages: ThreadMessage[]) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "streaming") return;

      const userId = getAnonymousUserId();
      const userMessage: ThreadMessage = {
        id: `local-user-${Date.now()}`,
        role: "user",
        text: trimmed,
        createdAt: Date.now(),
      };

      const assistantId = `local-assistant-${Date.now()}`;
      const assistantMessage: ThreadMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
        status: "streaming",
        createdAt: Date.now(),
        sources: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setStatus("streaming");
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, threadId, message: trimmed }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to start stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        const sources: MessageSource[] = [];
        let serverMessageId: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;

            const event = JSON.parse(line.slice(6)) as SSEEvent;

            if (event.type === "token") {
              fullText += event.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: fullText } : m,
                ),
              );
            } else if (event.type === "source") {
              sources.push({ url: event.url, title: event.title });
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, sources: [...sources] } : m,
                ),
              );
            } else if (event.type === "done") {
              serverMessageId = event.messageId;
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  id: serverMessageId ?? m.id,
                  text: fullText,
                  status: "complete",
                  sources,
                }
              : m,
          ),
        );
        setStatus("ready");
      } catch (err) {
        if (controller.signal.aborted) {
          setStatus("ready");
          return;
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setStatus("error");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, status: "error", text: m.text || message }
              : m,
          ),
        );
      }
    },
    [threadId, status],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");
  }, []);

  return {
    messages,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
  };
}
