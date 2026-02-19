import { generateId, type UIMessage } from "ai";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";

export type ChatDocument = {
  chatId: string;
  messages: UIMessage[];
  createdAt: Date;
  updatedAt: Date;
};

async function getChatsCollection(): Promise<Collection<ChatDocument>> {
  const db = await getDb();
  const collection = db.collection<ChatDocument>("chats");

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

