"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAnonymousUserId } from "@/lib/anonymous-user";

type UserIdContextValue = {
  userId: string | null;
};

const UserIdContext = createContext<UserIdContextValue>({ userId: null });

export function UserIdProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getAnonymousUserId());
  }, []);

  return (
    <UserIdContext.Provider value={{ userId }}>
      {children}
    </UserIdContext.Provider>
  );
}

export function useUserId() {
  return useContext(UserIdContext).userId;
}
