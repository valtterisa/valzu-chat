import { generateId, type UIMessage } from "ai";
import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";
import { betterAuthDb } from "./mongodb";

export type ChatDocument = {
  chatId: string;
  messages: UIMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export type ChatSummary = {
  chatId: string;
  messageCount: number;
  updatedAt: Date;
};

async function getChatsCollection(): Promise<Collection<ChatDocument>> {
  const collection = betterAuthDb.collection<ChatDocument>("chats");

  await collection.createIndex({ chatId: 1 }, { unique: true });

  return collection;
}

export async function getChat(chatId: string): Promise<UIMessage[]> {
  const collection = await getChatsCollection();
  const doc = await collection.findOne({ chatId });
  return doc?.messages ?? [];
}

export async function upsertChat(
  chatId: string,
  messages: UIMessage[],
): Promise<void> {
  const collection = await getChatsCollection();
  const now = new Date();

  await collection.updateOne(
    { chatId },
    {
      $set: {
        messages,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

export async function createChat(
  initialMessages: UIMessage[] = [],
): Promise<string> {
  const collection = await getChatsCollection();
  const chatId = generateId();
  const now = new Date();

  await collection.insertOne({
    chatId,
    messages: initialMessages,
    createdAt: now,
    updatedAt: now,
  });

  return chatId;
}

export async function listChats(limit = 50): Promise<ChatSummary[]> {
  const collection = await getChatsCollection();
  const docs = await collection
    .find({}, { sort: { updatedAt: -1 }, limit })
    .toArray();

  return docs.map((doc) => ({
    chatId: doc.chatId,
    messageCount: doc.messages.length,
    updatedAt: doc.updatedAt ?? doc.createdAt,
  }));
}

export async function deleteChat(chatId: string): Promise<boolean> {
  const collection = await getChatsCollection();
  const res = await collection.deleteOne({ chatId });

  if (res.deletedCount && res.deletedCount > 0) {
    return true;
  }

  if (ObjectId.isValid(chatId)) {
    const byId = await collection.deleteOne({ _id: new ObjectId(chatId) });
    return Boolean(byId.deletedCount && byId.deletedCount > 0);
  }

  return false;
}

