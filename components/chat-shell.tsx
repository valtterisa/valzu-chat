"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { ChatSummary } from "@/lib/chat-repo";
import { ChatSidebar } from "@/components/chat-sidebar";
import { UserBar } from "@/components/user-bar";

type ChatShellProps = {
  chats: ChatSummary[];
  children: ReactNode;
};

export function ChatShell({ chats, children }: ChatShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <ChatSidebar
        chats={chats}
        onOpenChange={setMobileSidebarOpen}
        open={mobileSidebarOpen}
        variant="overlay"
      />

      <div className="hidden h-full md:block">
        <ChatSidebar chats={chats} variant="inline" />
      </div>

      <main className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <UserBar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-2 sm:px-4">
            <div className="flex min-h-0 w-full max-w-3xl flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

