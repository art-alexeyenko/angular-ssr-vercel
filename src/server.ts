import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Decide the HTTP status purely from the request path, up front — before Angular
 * renders anything. This is authoritative because Angular's `withRoutes(...)` status
 * (app.routes.server.ts) is not reliably propagated in every runtime: on Vercel's
 * serverless Node it collapses to 200 even though the correct component is rendered.
 *
 * Returns `null` for paths whose status should come from the engine instead — e.g.
 * the home page (200) or the wildcard route's 302 redirect. Keep in sync with
 * app.routes.server.ts.
 */
function statusForPath(pathname: string): number | null {
  switch (pathname) {
    case '/404':
      return 404;
    case '/500':
      return 500;
    default:
      return null;
  }
}

/**
 * Render a request with Angular.
 *
 * `AngularNodeAppEngine.handle()` reads `req.url` at call time, so to force the
 * engine to render a *specific* route regardless of the URL the client asked for,
 * temporarily point `req.url` at that route. Example:
 *
 *   const response = await renderAngular(req, '/404'); // render the 404 page
 *
 * Note: when you force a route whose path differs from the browser URL, the client
 * bundle still bootstraps at the original URL, so its router may re-navigate on
 * hydration. Force-render is therefore best for terminal responses (error pages).
 */
function renderAngular(req: express.Request, forcePath?: string) {
  if (forcePath === undefined) {
    return angularApp.handle(req);
  }

  const originalUrl = req.url;
  req.url = forcePath;
  try {
    return angularApp.handle(req);
  } finally {
    req.url = originalUrl;
  }
}

/**
 * Serve static files from /browser.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use(async (req, res, next) => {
  try {
    // 1. Decide the status from the path, before we reach Angular.
    const forcedStatus = statusForPath(req.path);

    // 2. Render with Angular. (Pass a second arg to renderAngular to force a route.)
    const response = await renderAngular(req);
    if (!response) {
      next();
      return;
    }

    // 3. Emit Angular's rendered body, but with the status we already decided.
    //    Fall back to the engine's status for non-error paths (home, redirects, ...).
    const sentStatus = forcedStatus ?? response.status;

    // TEMP DIAGNOSTIC: keep until confirmed on Vercel, then remove this block.
    console.log(
      `[SSR] method=${req.method} path=${req.path} host=${req.headers.host} ` +
        `engineStatus=${response.status} sentStatus=${sentStatus}`
    );

    res.status(sentStatus);
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      // Let res.send recompute these to match the (re)sent body.
      if (lower === 'content-length' || lower === 'content-encoding') return;
      res.setHeader(key, value);
    });
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 3000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (dev-server and build) and by the serverless entry point.
 */
export const reqHandler = createNodeRequestHandler(app);
export default reqHandler;
