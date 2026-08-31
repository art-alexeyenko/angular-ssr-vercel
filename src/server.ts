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
 * Explicit-status lookup for error routes. In some runtimes (observed on Vercel's
 * serverless Node) the status assigned by `withRoutes(...)` in app.routes.server.ts
 * does not survive to the emitted response and collapses to 200, even though the
 * correct component is rendered. We reapply the intended status ourselves so it is
 * deterministic everywhere. Keep this in sync with app.routes.server.ts.
 */
const statusByPath = new Map<string, number>([
  ['/404', 404],
  ['/500', 500],
]);

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
    const response = await angularApp.handle(req);

    if (!response) {
      next();
      return;
    }

    // Prefer the intended status from the server-route table; fall back to whatever
    // the engine assigned (e.g. 302 redirects for the wildcard route).
    const engineStatus = response.status;
    const sentStatus = statusByPath.get(req.path) ?? engineStatus;

    // TEMP DIAGNOSTIC: keep until confirmed on Vercel, then remove this block.
    console.log(
      `[SSR] method=${req.method} url=${req.url} host=${req.headers.host} ` +
        `engineStatus=${engineStatus} sentStatus=${sentStatus}`
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
