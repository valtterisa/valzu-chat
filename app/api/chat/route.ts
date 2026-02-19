import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createIdGenerator,
  smoothStream,
} from "ai";
import { mistral } from "@ai-sdk/mistral";
import { getChat, upsertChat } from "@/lib/chat-repo";

// Allow streaming responses up to 90 seconds
export const maxDuration = 90;

type ChatRequestBody = {
  message: UIMessage;
  id: string;
  model: string;
  webSearch: boolean;
};

export async function POST(req: Request) {
  const { message, id, model, webSearch }: ChatRequestBody = await req.json();

  const previousMessages = await getChat(id);
  const messages: UIMessage[] = [...previousMessages, message];

  const result = streamText({
    model: webSearch ? "perplexity/sonar" : mistral(model),
    messages: await convertToModelMessages(messages),
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
    experimental_transform: smoothStream({
      delayInMs: 20, // optional: defaults to 10ms
      chunking: "line", // optional: defaults to 'word'
    }),
  });

  result.consumeStream();

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendSources: true,
    sendReasoning: true,
    generateMessageId: createIdGenerator({
      prefix: "msg",
      size: 16,
    }),
    onFinish: async ({ messages }) => {
      await upsertChat(id, messages);
    },
  });
}
