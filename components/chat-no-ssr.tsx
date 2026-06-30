"use client";

import { useEffect, useState } from "react";
import type { ThreadMessage } from "@/lib/messages";
import Chat from "@/components/chat";
import { getAnonymousUserId } from "@/lib/anonymous-user";

type Props = {
  threadId: string;
};

export function ChatNoSSR({ threadId }: Props) {
  const [mounted, setMounted] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ThreadMessage[]>([]);

  useEffect(() => {
    setMounted(true);
    const userId = getAnonymousUserId();
    void fetch(
      `/api/threads/${encodeURIComponent(threadId)}?userId=${encodeURIComponent(userId)}`,
    )
      .then((res) => res.json())
      .then((data: { messages?: ThreadMessage[] }) => {
        setInitialMessages(data.messages ?? []);
      })
      .catch(() => setInitialMessages([]));
  }, [threadId]);

  if (!mounted) return null;

  return <Chat initialMessages={initialMessages} threadId={threadId} />;
}
