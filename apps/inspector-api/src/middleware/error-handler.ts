import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/** Central error handler wired via `app.onError`. */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error('[unhandled error]', err);
  return c.json({ error: 'Internal Server Error' }, 500);
};
