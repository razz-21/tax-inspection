// Vercel serverless entry point for the Hono API.
//
// Vercel treats every file under this top-level `/api` directory as a
// serverless function. `vercel.json` rewrites all `/api/*` requests to this
// single function, and `hono/vercel` adapts the Hono app to Vercel's
// Web-standard (Request -> Response) function signature.
//
// Vercel's Node builder transpiles each source file individually (it does NOT
// run a bundler over the workspace), so it cannot resolve the
// `@tax-inspection/shared` TypeScript path alias used deep inside the API.
// To avoid a runtime "Cannot find module '@tax-inspection/shared'" crash, the
// Hono app is pre-bundled into a single self-contained ESM file by the esbuild
// step in `vercel.json`'s buildCommand, with the alias inlined. We import that
// build artifact here. It is generated fresh on every deploy (dist/ is
// gitignored), and Vercel's dependency tracer includes it in the function.
//
// Runs on the Node.js runtime (the default) because the API uses the native
// MongoDB driver, bcryptjs and jsonwebtoken, which are not Edge-compatible.
import { handle } from 'hono/vercel';
// @ts-ignore -- generated at build time; no type declarations.
import app from '../dist/inspector-api-vercel/app.mjs';

export default handle(app);
