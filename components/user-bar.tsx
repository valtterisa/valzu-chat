"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "autumn-js/react";
import { signOut, useSession } from "@/lib/auth-client";
import { ChevronDown, Menu } from "lucide-react";

type UserBarProps = {
  onOpenSidebar?: () => void;
};

type UsageState = {
  total: number;
  remaining: number;
  percent: number;
};

export function UserBar({ onOpenSidebar }: UserBarProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { check } = useCustomer();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { data } = check({ featureId: "token_usage" });
  const includedUsage = data?.included_usage ?? 0;
  const balance = data?.balance ?? 0;

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
        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={open}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full bg-card px-2 py-1 hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {session.user.email?.[0]?.toUpperCase() ?? "U"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
            <span className="sr-only">Open user menu</span>
          </button>
          {open && (
            <div className="absolute left-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card py-3 text-sm shadow-lg">
              <div className="flex items-center gap-3 px-4 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {session.user.email?.[0]?.toUpperCase() ?? "U"}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {session.user.email}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Billing & usage
                  </div>
                </div>
              </div>
              <div className="border-y border-border px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Messages left</span>
                  {data ? (
                    <span className="font-medium">
                      {balance} / {includedUsage}
                    </span>
                  ) : (
                    <span className="font-medium text-muted-foreground">
                      Not available
                    </span>
                  )}
                </div>
                {includedUsage > 0 && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-[width]"
                      style={{
                        width: `${(balance / includedUsage) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 px-2 pt-2">
                <button
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
                  onClick={() => {
                    router.push("/billing");
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span>Billing dashboard</span>
                </button>
                <button
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
                  onClick={handleSignOut}
                  type="button"
                >
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
