/*
 * The server bundle is imported dynamically so Vercel keeps it as an external file
 * (bundled via `functions.includeFiles`) instead of inlining the whole Angular server
 * into the function. The rewrite preserves the original request path, so Angular's
 * server routes (app.routes.server.ts) match correctly and emit the right HTTP status.
 */
export default async function handler(req, res) {
  const { reqHandler } = await import('../dist/minirep/server/server.mjs');
  return reqHandler(req, res);
}
