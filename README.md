# minirep — Minimal Angular SSR Vercel repro

A deliberately minimal Angular SSR application used to reproduce and demonstrate
Vercel deployment issues. It contains **no Content SDK logic** — just three routes
that exercise the three HTTP status codes we care about.

## Routes

| Path   | Component          | HTTP status |
| ------ | ------------------ | ----------- |
| `/`    | `HomeComponent`    | `200`       |
| `/404` | `NotFoundComponent`| `404`       |
| `/500` | `ErrorComponent`   | `500`       |

Any unknown path is redirected to `/404`. The wildcard route uses a route-data
resolver that returns a `RedirectCommand` (see `notFoundRedirectResolver` in
[`src/app/app.routes.ts`](src/app/app.routes.ts)), so the server issues a `302`
to `/404`, which then responds `404`.

Status codes for `/404` and `/500` are driven by the `status` field on the
`ServerRoute` entries in [`src/app/app.routes.server.ts`](src/app/app.routes.server.ts).

## How it works

- **SSR** via `@angular/ssr` (`outputMode: server` in `angular.json`).
- [`src/server.ts`](src/server.ts) is a small Express app that serves static
  assets and forwards everything else to `AngularNodeAppEngine`. It exports a
  handler built with `createNodeRequestHandler(app)`.
- [`api/index.mjs`](api/index.mjs) is the Vercel serverless entry point. It
  imports the built `server.mjs` and invokes its default handler.
- [`vercel.json`](vercel.json) rewrites all requests to `/api/index` and bundles
  the built server output with the function.

## Local development

```bash
npm install
npm run dev          # ng serve with SSR dev server → http://localhost:4200
```

## Production build + run

```bash
npm run build        # outputs to dist/minirep/{browser,server}
npm run serve:ssr    # node dist/minirep/server/server.mjs → http://localhost:3000
# or in one step:
npm start
```

Verify the status codes:

```bash
curl -i http://localhost:3000/      # 200
curl -i http://localhost:3000/404   # 404
curl -i http://localhost:3000/500   # 500
curl -i http://localhost:3000/nope  # 302 → /404 (then 404)
```

## Deploy to Vercel

The repo root is `examples/minirep`. Vercel uses `vercel.json` for the build
command, output directory, function bundling, and rewrites.
