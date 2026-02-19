import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listChats } from "@/lib/chat-repo";
import { ChatShell } from "@/components/chat-shell";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const chats = await listChats();

  return <ChatShell chats={chats}>{children}</ChatShell>;
}
