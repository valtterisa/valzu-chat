"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { ChatSummary } from "@/lib/chat-repo";
import { ArrowLeftToLine, ArrowRightToLine, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  chats: ChatSummary[];
  variant?: "inline" | "overlay";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ChatSidebar({
  chats,
  variant = "inline",
  open,
  onOpenChange,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(
    null,
  );

  const activeChatId = useMemo(() => {
    const match = pathname?.match(/^\/c\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [pathname]);

  const toggle = useCallback(() => {
    setCollapsed((v) => !v);
  }, []);

  if (variant === "overlay") {
    const handleClose = () => {
      onOpenChange?.(false);
    };

    return (
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div
          className={[
            "h-full w-full border-r border-border bg-card transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-12 items-center justify-between px-3">
            <div className="text-sm font-semibold">Chats</div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs hover:bg-accent"
              onClick={handleClose}
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="px-3 pb-3">
            <Link
              className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
              href="/"
              onClick={handleClose}
            >
              New chat
            </Link>
          </div>

          <div className="h-[calc(100%-6rem)] overflow-auto px-3 pb-4">
            {chats.length === 0 ? (
              <div className="px-1 py-3 text-xs text-muted-foreground">
                No chats yet.
              </div>
            ) : (
              <ul className="space-y-1">
                {chats.map((chat) => {
                  const isActive = chat.chatId === activeChatId;
                  return (
                    <li key={chat.chatId}>
                      <div
                        className={[
                          "flex items-stretch gap-1 rounded-md border p-1 text-xs",
                          isActive
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:bg-accent",
                        ].join(" ")}
                      >
                        <Link
                          className="flex min-w-0 flex-1 flex-col rounded-md px-2 py-1.5 hover:bg-accent"
                          href={`/c/${chat.chatId}`}
                          onClick={handleClose}
                        >
                          <div className="truncate font-medium">
                            Chat {chat.chatId}
                          </div>
                          <div className="text-muted-foreground">
                            {chat.messageCount} msg
                          </div>
                        </Link>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                          disabled={deletingChatId === chat.chatId}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPendingDeleteChatId(chat.chatId);
                            setConfirmOpen(true);
                          }}
                          type="button"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Dialog
            open={confirmOpen}
            onOpenChange={(dialogOpen) => {
              setConfirmOpen(dialogOpen);
              if (!dialogOpen) {
                setPendingDeleteChatId(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete chat</DialogTitle>
                <DialogDescription>
                  This will permanently delete this chat and its messages. This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                  onClick={() => {
                    setConfirmOpen(false);
                    setPendingDeleteChatId(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                  disabled={
                    !pendingDeleteChatId ||
                    deletingChatId === pendingDeleteChatId
                  }
                  onClick={() => {
                    if (!pendingDeleteChatId) return;
                    void handleDeleteChat(pendingDeleteChatId);
                    setConfirmOpen(false);
                    setPendingDeleteChatId(null);
                    handleClose();
                  }}
                  type="button"
                >
                  Delete
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      setDeletingChatId(chatId);
      try {
        const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          console.error("Failed to delete chat", chatId);
          return;
        }

        const data = (await res.json()) as { deleted?: boolean };

        if (!data.deleted) {
          console.error("Chat delete returned deleted=false", chatId);
          return;
        }

        if (activeChatId === chatId) {
          router.push("/");
          router.refresh();
          return;
        }

        router.refresh();
      } finally {
        setDeletingChatId((v) => (v === chatId ? null : v));
      }
    },
    [activeChatId, router],
  );

  return (
    <aside
      className={[
        "h-full border-r border-border bg-card/50",
        collapsed ? "w-12" : "w-72",
        "transition-[width] duration-200 ease-out",
        "shrink-0",
      ].join(" ")}
    >
      <div className="flex h-12 items-center justify-between px-2">
        {!collapsed && <div className="text-sm font-semibold px-2">Chats</div>}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs hover:bg-accent"
          onClick={toggle}
          type="button"
        >
          {collapsed ? (
            <ArrowRightToLine className="h-4 w-4" />
          ) : (
            <ArrowLeftToLine className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-2 pb-2">
          <Link
            className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            href="/"
          >
            New chat
          </Link>
        </div>
      )}

      {!collapsed && (
        <div className="h-[calc(100%-6rem)] overflow-auto px-2 pb-3">
          {chats.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No chats yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => {
                const isActive = chat.chatId === activeChatId;
                return (
                  <li key={chat.chatId}>
                    <div
                      className={[
                        "flex items-stretch gap-1 rounded-md border p-1 text-xs",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-accent",
                      ].join(" ")}
                    >
                      <Link
                        className="flex min-w-0 flex-1 flex-col rounded-md px-2 py-1.5 hover:bg-accent"
                        href={`/c/${chat.chatId}`}
                      >
                        <div className="truncate font-medium">
                          Chat {chat.chatId}
                        </div>
                        <div className="text-muted-foreground">
                          {chat.messageCount} msg
                        </div>
                      </Link>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                        disabled={deletingChatId === chat.chatId}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingDeleteChatId(chat.chatId);
                          setConfirmOpen(true);
                        }}
                        type="button"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingDeleteChatId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat</DialogTitle>
            <DialogDescription>
              This will permanently delete this chat and its messages. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <button
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
              onClick={() => {
                setConfirmOpen(false);
                setPendingDeleteChatId(null);
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
              disabled={
                !pendingDeleteChatId || deletingChatId === pendingDeleteChatId
              }
              onClick={() => {
                if (!pendingDeleteChatId) return;
                void handleDeleteChat(pendingDeleteChatId);
                setConfirmOpen(false);
                setPendingDeleteChatId(null);
              }}
              type="button"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
