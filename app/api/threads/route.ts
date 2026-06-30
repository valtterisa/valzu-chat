import { NextResponse } from "next/server";
import {
  createThread,
  listThreads,
} from "@/lib/thread-repo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const threads = await listThreads(userId);
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("list threads failed", { error, userId });
    return NextResponse.json(
      { error: "Failed to list threads" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: { userId?: string; title?: string };
  try {
    body = (await request.json()) as { userId?: string; title?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const threadId = await createThread(body.userId, body.title ?? "New chat");
    return NextResponse.json({ threadId });
  } catch (error) {
    console.error("create thread failed", { error, userId: body.userId });
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 },
    );
  }
}
