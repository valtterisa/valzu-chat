import { Timestamp } from "@google-cloud/firestore";
import { getFirestore } from "@/lib/firestore";
import type {
  HistoryMessage,
  MessageSource,
  MessageStatus,
  ThreadMessage,
  ThreadSummary,
} from "@/lib/messages";

function threadsCol(userId: string) {
  return getFirestore().collection("users").doc(userId).collection("threads");
}

function messagesCol(userId: string, threadId: string) {
  return threadsCol(userId).doc(threadId).collection("messages");
}

function toMillis(value: Timestamp | number | undefined): number {
  if (value === undefined) return Date.now();
  if (typeof value === "number") return value;
  return value.toMillis();
}

export async function createThread(
  userId: string,
  title = "New chat",
): Promise<string> {
  const now = Date.now();
  const ref = threadsCol(userId).doc();
  await ref.set({
    title,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function listThreads(userId: string): Promise<ThreadSummary[]> {
  const snap = await threadsCol(userId).orderBy("updatedAt", "desc").get();
  const threads: ThreadSummary[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const msgSnap = await messagesCol(userId, doc.id).count().get();
    threads.push({
      threadId: doc.id,
      title: (data.title as string) ?? "New chat",
      createdAt: toMillis(data.createdAt as Timestamp | number),
      updatedAt: toMillis(data.updatedAt as Timestamp | number),
      messageCount: msgSnap.data().count,
    });
  }

  return threads;
}

export async function getThreadMessages(
  userId: string,
  threadId: string,
): Promise<ThreadMessage[]> {
  const snap = await messagesCol(userId, threadId)
    .orderBy("createdAt", "asc")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      role: data.role as ThreadMessage["role"],
      text: (data.text as string) ?? "",
      sources: data.sources as MessageSource[] | undefined,
      createdAt: toMillis(data.createdAt as Timestamp | number),
      status: data.status as MessageStatus | undefined,
    };
  });
}

export async function addMessage(
  userId: string,
  threadId: string,
  message: {
    role: ThreadMessage["role"];
    text: string;
    status?: MessageStatus;
    sources?: MessageSource[];
  },
): Promise<string> {
  const now = Date.now();
  const ref = messagesCol(userId, threadId).doc();
  await ref.set({
    role: message.role,
    text: message.text,
    ...(message.status ? { status: message.status } : {}),
    ...(message.sources ? { sources: message.sources } : {}),
    createdAt: now,
  });
  await threadsCol(userId).doc(threadId).update({
    updatedAt: now,
  });
  return ref.id;
}

export async function patchMessage(
  userId: string,
  threadId: string,
  messageId: string,
  fields: {
    text?: string;
    status?: MessageStatus;
    sources?: MessageSource[];
  },
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (fields.text !== undefined) updates.text = fields.text;
  if (fields.status !== undefined) updates.status = fields.status;
  if (fields.sources !== undefined) updates.sources = fields.sources;

  if (Object.keys(updates).length === 0) return;

  await messagesCol(userId, threadId).doc(messageId).update(updates);
  await threadsCol(userId).doc(threadId).update({ updatedAt: Date.now() });
}

export async function updateThreadTitle(
  userId: string,
  threadId: string,
  title: string,
): Promise<void> {
  await threadsCol(userId).doc(threadId).update({
    title,
    updatedAt: Date.now(),
  });
}

export async function deleteThread(
  userId: string,
  threadId: string,
): Promise<boolean> {
  const threadRef = threadsCol(userId).doc(threadId);
  const thread = await threadRef.get();
  if (!thread.exists) return false;

  const msgSnap = await messagesCol(userId, threadId).get();
  const batch = getFirestore().batch();
  for (const doc of msgSnap.docs) {
    batch.delete(doc.ref);
  }
  batch.delete(threadRef);
  await batch.commit();
  return true;
}

export async function getRecentHistory(
  userId: string,
  threadId: string,
  limit = 20,
): Promise<HistoryMessage[]> {
  const messages = await getThreadMessages(userId, threadId);
  return messages
    .filter((m) => m.status !== "streaming" && m.text.trim() !== "")
    .slice(-limit)
    .map((m) => ({ role: m.role, text: m.text }));
}

export function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) return trimmed || "New chat";
  return `${trimmed.slice(0, 48)}…`;
}
