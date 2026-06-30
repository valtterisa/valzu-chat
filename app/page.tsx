"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAnonymousUserId } from "@/lib/anonymous-user";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = getAnonymousUserId();
    void fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json())
      .then((data: { threadId?: string }) => {
        if (data.threadId) {
          router.replace(`/c/${data.threadId}`);
        }
      });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Starting new chat…
    </div>
  );
}
