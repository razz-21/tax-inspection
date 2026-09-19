import { serve } from '@hono/node-server';
import { env } from './config/env';
import { closeDatabase, connectToDatabase } from './config/database';
import app from './app';

async function bootstrap() {
  await connectToDatabase();

  const server = serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`🔥 Hono server listening on http://localhost:${info.port}`);
  });

  const shutdown = async () => {
    server.close();
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
