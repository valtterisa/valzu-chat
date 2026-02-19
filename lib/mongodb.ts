import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB || "valzu-chat";

if (!uri) {
  throw new Error("MONGODB_URI is not set in the environment");
}

export const betterAuthClient = new MongoClient(uri);
export const betterAuthDb = betterAuthClient.db(dbName);

export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  const mongoClient = new MongoClient(uri);
  client = await mongoClient.connect();
  return client;
}

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoClient = await getMongoClient();
  db = mongoClient.db(dbName);
  return db;
}
