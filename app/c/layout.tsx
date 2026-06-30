import type { ReactNode } from "react";
import { ChatShell } from "@/components/chat-shell";
import { UserIdProvider } from "@/components/user-id-provider";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <UserIdProvider>
      <ChatShell>{children}</ChatShell>
    </UserIdProvider>
  );
}
