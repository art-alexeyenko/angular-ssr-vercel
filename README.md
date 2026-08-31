# minirep — Minimal Angular SSR Vercel repro

Minimal repro app to demonstrate SSR Angular logic not being activated when deployed to Vercel. Every route will return an `HTTP 200` status - despite configuration difference in app.routes.server.ts.

## Routes

| Path   | Component          | HTTP status |
| ------ | ------------------ | ----------- |
| `/`    | `HomeComponent`    | `200`       |
| `/404` | `NotFoundComponent`| `404`       |
| `/500` | `ErrorComponent`   | `500`       |



## How it works

`/404` route and any other route other than `/` should produce a `404` response. It does so when app launched locally.
When deployed to Vercel, accessing `/404` directly or going to a non-root route (i.e. `/notexists`) will return status `200`.
Vercel deployment works through the `/api/index` serverless function that loads the server bundle. The server bundle logic (middlewares etc) will be executed when present. The Angular app bundle server logic is seemingly ignored.

## Production build + run

```bash
npm run build        # outputs to dist/minirep/{browser,server}
npm run serve:ssr    # node dist/minirep/server/server.mjs → http://localhost:3000
# or in one step:
npm start

## Deploy to Vercel

The repo root is `examples/minirep`. Vercel uses `vercel.json` for the build
command, output directory, function bundling, and rewrites.
