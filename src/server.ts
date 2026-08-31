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
 *
 * Express 5 no longer accepts a bare `'*'` route pattern, so the SSR handler is
 * registered as catch-all middleware. Instead of streaming the Web `Response` via
 * `writeResponseToNodeResponse` (which sets `res.statusCode` and ends the stream
 * directly), we explicitly copy the status and headers onto the Node response and
 * send the body with `res.status(...).send(...)`. This is the pattern the
 * Angular 20 SSR migration write-up uses and it propagates the status assigned by
 * the server routes (e.g. 404 / 500) reliably through serverless runtimes such as
 * Vercel, where direct stream termination can otherwise collapse the status to 200.
 */
app.use(async (req, res, next) => {
  try {
    const response = await angularApp.handle(req);

    if (!response) {
      next();
      return;
    }

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await response.text());
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
