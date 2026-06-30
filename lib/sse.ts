export type SSEEvent =
  | { type: "token"; text: string }
  | { type: "status"; text: string }
  | { type: "source"; url: string; title?: string }
  | { type: "done"; messageId?: string }
  | { type: "error"; message: string };

export function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!line) continue;

        const json = line.slice("data: ".length).trim();
        if (!json) continue;

        try {
          yield JSON.parse(json) as SSEEvent;
        } catch {
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
