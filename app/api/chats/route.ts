import { NextResponse } from "next/server";
import type { UIMessage } from "ai";
import { createChat } from "@/lib/chat-repo";

type CreateChatRequestBody = {
  initialMessages?: UIMessage[];
};

export async function POST(req: Request) {
  let body: CreateChatRequestBody | null = null;

  try {
    body = (await req.json()) as CreateChatRequestBody;
  } catch {
    body = null;
  }

  const initialMessages = body?.initialMessages ?? [];

  const chatId = await createChat(initialMessages);

  return NextResponse.json({ chatId });
}

