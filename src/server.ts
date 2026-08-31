import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
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
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      // TEMP DIAGNOSTIC: surface what the SSR engine actually sees/returns on Vercel.
      // `url` is the path Angular matches server routes against; `status` is what the
      // matched server route assigned. Compare these against the requested URL to tell
      // whether the path is being lost (always same url) or the status is correct but
      // getting flattened downstream.
      console.log(
        `[SSR] method=${req.method} url=${req.url} originalUrl=${req.originalUrl} ` +
          `host=${req.headers.host} -> ${response ? `status=${response.status}` : 'null (falling through to next())'}`
      );

      if (!response) {
        next();
        return;
      }

      const engineStatus = response.status;
      writeResponseToNodeResponse(response, res);
      // After writing, confirm the status actually set on the Node response object.
      console.log(`[SSR] url=${req.url} engineStatus=${engineStatus} res.statusCode=${res.statusCode}`);
    })
    .catch(next);
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
