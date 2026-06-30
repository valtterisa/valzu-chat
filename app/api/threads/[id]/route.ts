import { NextResponse } from "next/server";
import {
  deleteThread,
  getThreadMessages,
} from "@/lib/thread-repo";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id: threadId } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const messages = await getThreadMessages(userId, threadId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("get thread failed", { error, userId, threadId });
    return NextResponse.json(
      { error: "Failed to load thread" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id: threadId } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const deleted = await deleteThread(userId, threadId);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("delete thread failed", { error, userId, threadId });
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 },
    );
  }
}
