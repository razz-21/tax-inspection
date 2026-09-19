// Vercel serverless entry point for the Hono API.
//
// Vercel treats every file under this top-level `/api` directory as a
// serverless function. `vercel.json` rewrites all `/api/*` requests to this
// single function, and `hono/vercel` adapts the Hono app to Vercel's
// Web-standard (Request -> Response) function signature.
//
// Runs on the Node.js runtime (the default) because the API uses the native
// MongoDB driver, bcryptjs and jsonwebtoken, which are not Edge-compatible.
import { handle } from 'hono/vercel';
import app from '../apps/inspector-api/src/app';

export default handle(app);
