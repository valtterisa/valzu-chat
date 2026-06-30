import { GoogleAuth } from "google-auth-library";
import type { HistoryMessage } from "@/lib/messages";

export type BackendStreamRequest = {
  userId: string;
  threadId: string;
  message: string;
  history: HistoryMessage[];
};

function getBackendUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error("BACKEND_API_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const backendUrl = getBackendUrl();
  const isLocal =
    backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1");

  if (isLocal) {
    return { "Content-Type": "application/json" };
  }

  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(`${backendUrl}/stream`);
  const authHeaders = await client.getRequestHeaders();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  authHeaders.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

export async function streamFromBackend(
  request: BackendStreamRequest,
  signal?: AbortSignal,
): Promise<Response> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 95_000);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(`${getBackendUrl()}/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
