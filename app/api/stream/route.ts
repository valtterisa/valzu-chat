import { streamFromBackend } from "@/lib/backend-client";
import type { MessageSource } from "@/lib/messages";
import { formatSSE, parseSSEStream } from "@/lib/sse";
import {
  addMessage,
  deriveTitle,
  getRecentHistory,
  patchMessage,
  updateThreadTitle,
} from "@/lib/thread-repo";

export const maxDuration = 90;

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

export async function POST(request: Request) {
  const start = Date.now();
  let userId = "";
  let threadId = "";

  try {
    const body = (await request.json()) as {
      userId?: string;
      threadId?: string;
      message?: string;
    };

    userId = body.userId ?? "";
    threadId = body.threadId ?? "";
    const message = body.message?.trim() ?? "";

    if (!userId || !threadId || !message) {
      return new Response(
        JSON.stringify({ error: "userId, threadId, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await addMessage(userId, threadId, { role: "user", text: message });

    const messageId = await addMessage(userId, threadId, {
      role: "assistant",
      text: "",
      status: "streaming",
    });

    const allHistory = await getRecentHistory(userId, threadId, 20);
    const history = allHistory.filter(
      (m) => !(m.role === "user" && m.text === message),
    );

    const backendResponse = await streamFromBackend(
      { userId, threadId, message, history },
      request.signal,
    );

    if (!backendResponse.ok || !backendResponse.body) {
      await patchMessage(userId, threadId, messageId, { status: "error" });
      return new Response(
        JSON.stringify({ error: "Backend request failed" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    let fullText = "";
    const sources: MessageSource[] = [];
    const sourceUrls = new Set<string>();

    const debouncedSave = debounce((text: string) => {
      void patchMessage(userId, threadId, messageId, { text }).catch(
        (err) => console.error("debounced patch failed", { err, userId, threadId }),
      );
    }, 300);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const event of parseSSEStream(backendResponse.body!)) {
            if (request.signal.aborted) break;

            if (event.type === "token") {
              fullText += event.text;
              debouncedSave(fullText);
              controller.enqueue(
                encoder.encode(formatSSE({ type: "token", text: event.text })),
              );
            } else if (event.type === "status") {
              controller.enqueue(
                encoder.encode(formatSSE({ type: "status", text: event.text })),
              );
            } else if (event.type === "source") {
              if (!sourceUrls.has(event.url)) {
                sourceUrls.add(event.url);
                sources.push({ url: event.url, title: event.title });
              }
              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: "source",
                    url: event.url,
                    title: event.title,
                  }),
                ),
              );
            } else if (event.type === "error") {
              await patchMessage(userId, threadId, messageId, {
                text: fullText,
                status: "error",
              });
              controller.enqueue(
                encoder.encode(
                  formatSSE({ type: "error", message: event.message }),
                ),
              );
              controller.close();
              return;
            } else if (event.type === "done") {
              break;
            }
          }

          await patchMessage(userId, threadId, messageId, {
            text: fullText,
            sources,
            status: "complete",
          });

          if (history.length === 0) {
            await updateThreadTitle(userId, threadId, deriveTitle(message));
          }

          controller.enqueue(
            encoder.encode(formatSSE({ type: "done", messageId })),
          );
          controller.close();
        } catch (error) {
          console.error("stream failed", {
            error,
            userId,
            threadId,
            latencyMs: Date.now() - start,
          });
          await patchMessage(userId, threadId, messageId, {
            text: fullText,
            status: "error",
          }).catch(() => undefined);
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: "error",
                message: "Stream failed",
              }),
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("stream route failed", {
      error,
      userId,
      threadId,
      latencyMs: Date.now() - start,
    });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
