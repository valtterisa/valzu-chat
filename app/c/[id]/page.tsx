import Chat from "@/components/chat";
import { UserBar } from "@/components/user-bar";
import { getChat } from "@/lib/chat-repo";
import type { UIMessage } from "ai";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const messages: UIMessage[] = await getChat(id);

  return (
    <div className="flex h-screen w-full justify-center overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <UserBar />
        <Chat id={id} initialMessages={messages} />
      </main>
    </div>
  );
}

