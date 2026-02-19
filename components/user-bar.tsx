"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Menu } from "lucide-react";

type UserBarProps = {
  onOpenSidebar?: () => void;
};

export function UserBar({ onOpenSidebar }: UserBarProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/signin");
        },
      },
    });
  };

  if (isPending) {
    return null;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-xs hover:bg-accent md:hidden"
            onClick={onOpenSidebar}
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {session.user.email?.[0]?.toUpperCase() ?? "U"}
        </span>
        <div className="flex flex-col">
          <span className="font-medium">{session.user.email}</span>
          <span className="text-xs text-muted-foreground">Signed in</span>
        </div>
      </div>
      <button
        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        onClick={handleSignOut}
        type="button"
      >
        Sign out
      </button>
    </header>
  );
}

