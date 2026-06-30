import { Firestore } from "@google-cloud/firestore";

let db: Firestore | null = null;

export function getFirestore(): Firestore {
  if (!db) {
    const projectId =
      process.env.FIRESTORE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) {
      throw new Error(
        "FIRESTORE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be set",
      );
    }
    db = new Firestore({ projectId });
  }
  return db;
}
