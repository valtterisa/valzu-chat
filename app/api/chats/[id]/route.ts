import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteChat } from "@/lib/chat-repo";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteChat(id);

  return NextResponse.json({ deleted });
}

