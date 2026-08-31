import { Component } from '@angular/core';

/**
 * Static "not found" page. The `/404` server route (see `app.routes.server.ts`)
 * makes the server respond with an HTTP 404 status when this component is rendered.
 */
@Component({
  selector: 'app-not-found',
  template: `
    <main>
      <h1>404</h1>
      <p>Page not found. This page returns an HTTP 404 response.</p>
    </main>
  `,
})
export class NotFoundComponent {}
