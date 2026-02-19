import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listChats } from "@/lib/chat-repo";
import { UserBar } from "@/components/user-bar";
import { ChatSidebar } from "@/components/chat-sidebar";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const chats = await listChats();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <ChatSidebar chats={chats} />
      <main className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <UserBar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-4">
            <div className="flex min-h-0 w-full max-w-3xl flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

