export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export type UIMessageRole = "user" | "assistant" | "system";

export type UIMessage = {
  id: string;
  role: UIMessageRole;
  parts: UIMessagePart[];
};

export type UIMessagePart =
  | { type: "text"; text: string }
  | { type: "file"; url: string; mediaType?: string; filename?: string }
  | { type: string; [key: string]: unknown };

export type FileUIPart = {
  type: "file";
  url: string;
  mediaType?: string;
  filename?: string;
};

export type SourceDocumentUIPart = {
  type: "source-document";
  sourceId: string;
  title?: string;
  filename?: string;
  mediaType?: string;
};

export type ToolUIPartState =
  | "approval-requested"
  | "approval-responded"
  | "input-available"
  | "input-streaming"
  | "output-available"
  | "output-denied"
  | "output-error";

export type ToolUIPart = {
  type: "tool-invocation" | string;
  toolCallId: string;
  toolName: string;
  state: ToolUIPartState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  [key: string]: unknown;
};

export type DynamicToolUIPart = ToolUIPart & {
  type: "dynamic-tool";
};

export type Tool = {
  description?: string;
  parameters?: unknown;
  inputSchema?: unknown;
  jsonSchema?: unknown;
  execute?: (...args: unknown[]) => unknown;
};

export type LanguageModelUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
};

export type Experimental_GeneratedImage = {
  base64: string;
  mediaType?: string;
  uint8Array?: Uint8Array;
};

export type Experimental_SpeechResult = {
  audio: {
    base64: string;
    mediaType?: string;
  };
};

export type Experimental_TranscriptionResult = {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
};
