import { ChatNoSSR } from "@/components/chat-no-ssr";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  return <ChatNoSSR threadId={id} />;
}
