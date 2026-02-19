"use client";

import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import Chat from "@/components/chat";

type Props = {
  id: string;
  initialMessages: UIMessage[];
};

export function ChatNoSSR({ id, initialMessages }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Chat id={id} initialMessages={initialMessages} />;
}

