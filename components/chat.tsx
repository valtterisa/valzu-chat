"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { ThreadMessage } from "@/lib/messages";
import { useStreamChat } from "@/lib/use-stream-chat";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const suggestions = [
  "What's in the news today?",
  "Summarize recent AI developments",
  "What happened in tech this week?",
];

function ChatMessageItem({ message }: { message: ThreadMessage }) {
  const from = message.role === "user" ? "user" : "assistant";
  const sources = message.sources ?? [];

  return (
    <MessageBranch defaultBranch={0} key={message.id}>
      <MessageBranchContent>
        <Message from={from}>
          <div>
            {sources.length > 0 && (
              <Sources>
                <SourcesTrigger count={sources.length} />
                <SourcesContent>
                  {sources.map((source) => (
                    <Source
                      href={source.url}
                      key={source.url}
                      title={source.title ?? "Source"}
                    />
                  ))}
                </SourcesContent>
              </Sources>
            )}
            <MessageContent>
              <MessageResponse>
                {message.text ||
                  (message.status === "streaming" ? "…" : "")}
              </MessageResponse>
            </MessageContent>
          </div>
        </Message>
      </MessageBranchContent>
    </MessageBranch>
  );
}

type ChatProps = {
  threadId: string;
  initialMessages: ThreadMessage[];
};

export default function Chat({ threadId, initialMessages }: ChatProps) {
  const { messages, sendMessage, status, error, stop } = useStreamChat(
    threadId,
    initialMessages,
  );
  const [text, setText] = useState("");

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim()) return;
      void sendMessage(message.text);
      setText("");
    },
    [sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      void sendMessage(suggestion);
    },
    [sendMessage],
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    [],
  );

  const isSubmitDisabled = useMemo(
    () => !(text.trim() || status === "streaming") || status === "streaming",
    [text, status],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <Conversation className="min-h-0">
        <ConversationContent>
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="flex min-w-0 shrink-0 flex-col gap-4 border-t border-border bg-background px-2 pb-2 pt-2 sm:px-4 sm:pb-4 sm:pt-4">
        <Suggestions className="min-w-0 hidden md:flex">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
        <div className="min-w-0">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea onChange={handleTextChange} value={text} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputSubmit
                disabled={isSubmitDisabled}
                onStop={stop}
                status={status === "streaming" ? "streaming" : "ready"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
