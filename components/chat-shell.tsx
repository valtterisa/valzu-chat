"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { ThreadSummary } from "@/lib/messages";
import { useUserId } from "@/components/user-id-provider";
import { ChatSidebar } from "@/components/chat-sidebar";

type ChatShellProps = {
  children: ReactNode;
};

export function ChatShell({ children }: ChatShellProps) {
  const userId = useUserId();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(
      `/api/threads?userId=${encodeURIComponent(userId)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as { threads: ThreadSummary[] };
    setThreads(data.threads);
  }, [userId]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <ChatSidebar
        onOpenChange={setMobileSidebarOpen}
        onThreadsChange={loadThreads}
        open={mobileSidebarOpen}
        threads={threads}
        userId={userId}
        variant="overlay"
      />

      <div className="hidden h-full md:block">
        <ChatSidebar
          onThreadsChange={loadThreads}
          threads={threads}
          userId={userId}
          variant="inline"
        />
      </div>

      <main className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <header className="flex h-12 shrink-0 items-center border-b border-border px-3 md:hidden">
          <button
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium"
            onClick={() => setMobileSidebarOpen(true)}
            type="button"
          >
            Chats
          </button>
        </header>
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
