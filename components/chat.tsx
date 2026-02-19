"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import type { UIMessage } from "ai";
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from "ai";
import { useChat } from "@ai-sdk/react";

import type { AttachmentData } from "@/components/ai-elements/attachments";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { CheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCustomer } from "autumn-js/react";

const modelCategories = [
  {
    id: "fast",
    heading: "Fast",
    description: "Quick responses, lower cost",
    models: [
      {
        chefSlug: "mistral",
        id: "ministral-3b-latest",
        name: "Ministral 3B",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "ministral-8b-latest",
        name: "Ministral 8B",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "mistral-small-latest",
        name: "Mistral Small",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "magistral-small-2507",
        name: "Magistral Small 2507",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "magistral-small-2506",
        name: "Magistral Small 2506",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "open-mistral-7b",
        name: "Open Mistral 7B",
        providers: ["mistral"],
      },
    ],
  },
  {
    id: "balanced",
    heading: "Balanced",
    description: "Good speed and quality",
    models: [
      {
        chefSlug: "mistral",
        id: "mistral-medium-latest",
        name: "Mistral Medium",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "mistral-medium-2508",
        name: "Mistral Medium 2508",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "mistral-medium-2505",
        name: "Mistral Medium 2505",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "magistral-medium-2507",
        name: "Magistral Medium 2507",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "magistral-medium-2506",
        name: "Magistral Medium 2506",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "open-mixtral-8x7b",
        name: "Open Mixtral 8x7B",
        providers: ["mistral"],
      },
    ],
  },
  {
    id: "powerful",
    heading: "Powerful",
    description: "Best quality, complex tasks",
    models: [
      {
        chefSlug: "mistral",
        id: "mistral-large-latest",
        name: "Mistral Large",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "open-mixtral-8x22b",
        name: "Open Mixtral 8x22B",
        providers: ["mistral"],
      },
    ],
  },
  {
    id: "vision",
    heading: "Vision",
    description: "Image understanding",
    models: [
      {
        chefSlug: "mistral",
        id: "pixtral-large-latest",
        name: "Pixtral Large",
        providers: ["mistral"],
      },
      {
        chefSlug: "mistral",
        id: "pixtral-12b-2409",
        name: "Pixtral 12B 2409",
        providers: ["mistral"],
      },
    ],
  },
];

const models = modelCategories.flatMap((c) => c.models);

const suggestions = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
  "Best practices for React development",
  "Tell me about TypeScript benefits",
  "How to optimize database queries?",
  "What is the difference between SQL and NoSQL?",
  "Explain cloud computing basics",
];

const AttachmentItem = ({
  attachment,
  onRemove,
}: {
  attachment: AttachmentData;
  onRemove: (id: string) => void;
}) => {
  const handleRemove = useCallback(() => {
    onRemove(attachment.id);
  }, [onRemove, attachment.id]);

  return (
    <Attachment data={attachment} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
};

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  const handleRemove = useCallback(
    (id: string) => {
      attachments.remove(id);
    },
    [attachments],
  );

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={handleRemove}
        />
      ))}
    </Attachments>
  );
};

const SuggestionItem = ({
  suggestion,
  onClick,
}: {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(suggestion);
  }, [onClick, suggestion]);

  return <Suggestion onClick={handleClick} suggestion={suggestion} />;
};

function UIMessageItem({ message }: { message: UIMessage }) {
  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => isTextUIPart(p))
    .map((p) => p.text)
    .join("");
  const reasoningParts = message.parts.filter(isReasoningUIPart);
  const sourceParts = message.parts.filter((p) => p.type === "source-url") as {
    type: "source-url";
    url: string;
    title?: string;
  }[];

  const from = message.role === "user" ? "user" : "assistant";

  return (
    <MessageBranch defaultBranch={0} key={message.id}>
      <MessageBranchContent>
        <Message from={from}>
          <div>
            {sourceParts.length > 0 && (
              <Sources>
                <SourcesTrigger count={sourceParts.length} />
                <SourcesContent>
                  {sourceParts.map((source) => (
                    <Source
                      href={source.url}
                      key={source.url}
                      title={source.title ?? "Source"}
                    />
                  ))}
                </SourcesContent>
              </Sources>
            )}
            {reasoningParts.length > 0 && (
              <Reasoning duration={0}>
                <ReasoningTrigger />
                <ReasoningContent>
                  {reasoningParts.map((r) => r.text).join("\n\n")}
                </ReasoningContent>
              </Reasoning>
            )}
            <MessageContent>
              <MessageResponse>{textContent}</MessageResponse>
            </MessageContent>
          </div>
        </Message>
      </MessageBranchContent>
    </MessageBranch>
  );
}

const ModelItem = ({
  m,
  isSelected,
  onSelect,
}: {
  m: { chefSlug: string; id: string; name: string; providers: string[] };
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const handleSelect = useCallback(() => {
    onSelect(m.id);
  }, [onSelect, m.id]);

  return (
    <ModelSelectorItem onSelect={handleSelect} value={m.id}>
      <ModelSelectorLogo provider={m.chefSlug} />
      <ModelSelectorName>{m.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        {m.providers.map((provider) => (
          <ModelSelectorLogo key={provider} provider={provider} />
        ))}
      </ModelSelectorLogoGroup>
      {isSelected ? (
        <CheckIcon className="ml-auto size-4" />
      ) : (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  );
};

type ChatProps = {
  id?: string;
  initialMessages?: UIMessage[];
};

export default function Chat({ id, initialMessages }: ChatProps) {
  const broadcastChannelName = id ? `valzu-chat-${id}` : null;
  const isApplyingRemoteUpdate = useRef(false);
  const [model, setModel] = useState<string>(models[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [text, setText] = useState<string>("");

  const { check } = useCustomer();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ messages, id, body }) {
          const lastMessage = messages[messages.length - 1];

          return {
            body: {
              message: lastMessage,
              id,
              ...body,
            },
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id,
    messages: initialMessages,
    transport,
  });

  useEffect(() => {
    if (!broadcastChannelName) {
      return;
    }

    const channel = new BroadcastChannel(broadcastChannelName);

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as {
        type: string;
        messages: UIMessage[];
      };

      if (data.type !== "messages-update") {
        return;
      }

      isApplyingRemoteUpdate.current = true;
      setMessages(data.messages);
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [broadcastChannelName, setMessages]);

  useEffect(() => {
    if (!broadcastChannelName) {
      return;
    }

    if (isApplyingRemoteUpdate.current) {
      isApplyingRemoteUpdate.current = false;
      return;
    }

    const channel = new BroadcastChannel(broadcastChannelName);
    channel.postMessage({
      type: "messages-update",
      messages,
    });
    channel.close();
  }, [broadcastChannelName, messages]);

  const selectedModelData = useMemo(
    () => models.find((m) => m.id === model),
    [model],
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      if (!check({ featureId: "token_usage" })) {
        toast.error("You're out of messages for your current plan.");
        return;
      }

      if (message.files?.length) {
        toast.success("Files attached", {
          description: `${message.files.length} file(s) attached to message`,
        });
      }

      sendMessage(
        {
          text: message.text || "Sent with attachments",
          files: message.files,
        },
        { body: { model } },
      );
      setText("");
    },
    [sendMessage, model],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!check({ featureId: "token_usage" })) {
        toast.error("You're out of messages for your current plan.");
        return;
      }

      sendMessage({ text: suggestion }, { body: { model } });
    },
    [sendMessage, model],
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    [],
  );

  const handleModelSelect = useCallback((modelId: string) => {
    setModel(modelId);
    setModelSelectorOpen(false);
  }, []);

  const isSubmitDisabled = useMemo(
    () => !(text.trim() || status) || status === "streaming",
    [text, status],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <Conversation className="min-h-0">
        <ConversationContent>
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {error.message}
            </div>
          )}
          {messages.map((message) => (
            <UIMessageItem key={message.id} message={message} />
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="flex min-w-0 shrink-0 flex-col gap-4 border-t border-border bg-background px-2 pb-2 pt-2 sm:px-4 sm:pb-4 sm:pt-4">
        <Suggestions className="min-w-0 hidden md:flex">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
        <div className="min-w-0">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea onChange={handleTextChange} value={text} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <ModelSelector
                  onOpenChange={setModelSelectorOpen}
                  open={modelSelectorOpen}
                >
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData?.chefSlug && (
                        <ModelSelectorLogo
                          provider={selectedModelData.chefSlug}
                        />
                      )}
                      {selectedModelData?.name && (
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                      {modelCategories.map((category) => (
                        <ModelSelectorGroup
                          heading={category.heading}
                          key={category.id}
                        >
                          {category.models.map((m) => (
                            <ModelItem
                              isSelected={model === m.id}
                              key={m.id}
                              m={m}
                              onSelect={handleModelSelect}
                            />
                          ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isSubmitDisabled}
                onStop={stop}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
