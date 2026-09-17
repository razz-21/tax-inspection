import { type Db, MongoClient } from 'mongodb';
import { env } from './env';

let client: MongoClient | null = null;
let db: Db | null = null;

/** Connects to MongoDB once and caches the client/db (idempotent). */
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(env.mongoUri, {
    serverSelectionTimeoutMS: 30_000,
  });
  await client.connect();
  db = client.db(env.mongoDbName);
  console.log(`✅ Connected to MongoDB database "${env.mongoDbName}"`);
  return db;
}

/** Returns the connected Db. Throws if `connectToDatabase()` hasn't run. */
export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/** Closes the connection (use on graceful shutdown). */
export async function closeDatabase(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
