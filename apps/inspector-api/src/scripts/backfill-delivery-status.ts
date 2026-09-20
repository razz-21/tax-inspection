/**
 * One-off migration: backfill `status` on delivery documents created before the
 * field existed. Idempotent — only touches docs missing the field, setting them
 * to "In Review". Safe to run multiple times.
 *
 * Run from the repo root:
 *   npm run migrate:delivery-status
 */
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Load the API's env (MONGODB_URI, MONGODB_DB_NAME) relative to the repo root.
config({ path: 'apps/inspector-api/.env' });

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? 'tax-inspection-dev';
  if (!uri) {
    throw new Error('MONGODB_URI is not set (checked apps/inspector-api/.env).');
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30_000 });
  try {
    await client.connect();
    const deliveries = client.db(dbName).collection('deliveries');

    const missing = await deliveries.countDocuments({
      status: { $exists: false },
    });
    console.log(`Found ${missing} delivery(ies) without a status.`);

    const result = await deliveries.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'In Review' } },
    );
    console.log(`✅ Updated ${result.modifiedCount} delivery(ies) to "In Review".`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
