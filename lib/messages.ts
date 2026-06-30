export type MessageRole = "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "error";

export type MessageSource = {
  url: string;
  title?: string;
};

export type ThreadMessage = {
  id: string;
  role: MessageRole;
  text: string;
  sources?: MessageSource[];
  createdAt: number;
  status?: MessageStatus;
};

export type ThreadSummary = {
  threadId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
};

export type HistoryMessage = {
  role: MessageRole;
  text: string;
};
