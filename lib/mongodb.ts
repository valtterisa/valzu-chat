import { MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "valzu-chat";

function getMongoUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const username = process.env.MONGO_INITDB_ROOT_USERNAME;
  const password = process.env.MONGO_INITDB_ROOT_PASSWORD;
  const host = process.env.MONGODB_HOST || "localhost";
  const port = process.env.MONGODB_PORT || "27017";
  const authSource = process.env.MONGODB_AUTH_SOURCE || "admin";

  if (username && password) {
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(
      password,
    )}@${host}:${port}/${dbName}?authSource=${authSource}`;
  }

  // Fallback for build-time / local dev without credentials;
  // connection will fail if Mongo actually requires auth.
  return `mongodb://${host}:${port}/${dbName}?authSource=${authSource}`;
}

const uri = getMongoUri();

declare global {
  var __mongoClient: MongoClient | undefined;
}

export const betterAuthClient =
  globalThis.__mongoClient ?? new MongoClient(uri);

if (!globalThis.__mongoClient) {
  globalThis.__mongoClient = betterAuthClient;
}

export const betterAuthDb = betterAuthClient.db(dbName);

export const betterAuthClientReady = betterAuthClient.connect();
