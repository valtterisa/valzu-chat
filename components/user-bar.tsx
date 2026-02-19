"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

export function UserBar() {
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
      <div className="flex items-center gap-2">
        <span className="h-8 w-8 rounded-full bg-primary/10 text-xs font-medium text-primary flex items-center justify-center">
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

