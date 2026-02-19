import { getChat } from "@/lib/chat-repo";
import type { UIMessage } from "ai";
import { ChatNoSSR } from "@/components/chat-no-ssr";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const messages: UIMessage[] = await getChat(id);

  return <ChatNoSSR id={id} initialMessages={messages} />;
}

