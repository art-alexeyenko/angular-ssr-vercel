import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server route config. `/404` and `/500` are server-rendered and return the matching
 * HTTP status. Everything else is server-rendered with the default 200.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '404', renderMode: RenderMode.Server, status: 404 },
  { path: '500', renderMode: RenderMode.Server, status: 500 },
  { path: '**', renderMode: RenderMode.Server },
];
