import { Component } from '@angular/core';

/**
 * Static home page. Server-rendered and returned with an HTTP 200 status.
 */
@Component({
  selector: 'app-home',
  template: `
    <main>
      <h1>Home</h1>
      <p>This is a static home page. It returns an HTTP 200 response.</p>
    </main>
  `,
})
export class HomeComponent {}
