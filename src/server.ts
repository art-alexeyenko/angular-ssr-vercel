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

/**
 * Trust the reverse-proxy `X-Forwarded-*` headers.
 *
 * Behind a proxy (e.g. Vercel) requests arrive with `x-forwarded-for`,
 * `x-forwarded-host`, `x-forwarded-proto`, etc. By default @angular/ssr only trusts
 * `x-forwarded-host` and `x-forwarded-proto`; ANY other `x-forwarded-*` header (such
 * as `x-forwarded-for`) makes the engine "deopt to CSR" as an SSRF safeguard — it
 * serves index.csr.html with a plain 200 and never applies the server-route status.
 * That is why every route returned 200 on Vercel but 404/500 worked locally (no proxy
 * headers). Vercel's edge validates these headers, so trusting them here is safe.
 */
const angularApp = new AngularNodeAppEngine({ trustProxyHeaders: true });

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
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
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
