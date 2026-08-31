import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { NotFoundComponent } from './pages/not-found.component';
import { ErrorComponent } from './pages/error.component';

/**
 * Resolver for the wildcard route. Rather than rendering the not-found page in place,
 * it returns a `RedirectCommand` so the router redirects unknown paths to `/404`,
 * where the `/404` server route emits the HTTP 404 status.
 */
export const notFoundRedirectResolver: ResolveFn<RedirectCommand> = () => {
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl('/404'));
};

/**
 * Client route table. Three explicit routes plus a wildcard that redirects to `/404`.
 * The HTTP status codes for `/404` and `/500` are configured in `app.routes.server.ts`.
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '404', component: NotFoundComponent },
  { path: '500', component: ErrorComponent },
  { path: '**', component: NotFoundComponent, resolve: { redirect: notFoundRedirectResolver } },
];
