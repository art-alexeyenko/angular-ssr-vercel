import { Component } from '@angular/core';

/**
 * Static error page. The `/500` server route (see `app.routes.server.ts`)
 * makes the server respond with an HTTP 500 status when this component is rendered.
 */
@Component({
  selector: 'app-error',
  template: `
    <main>
      <h1>500</h1>
      <p>Internal server error. This page returns an HTTP 500 response.</p>
    </main>
  `,
})
export class ErrorComponent {}
