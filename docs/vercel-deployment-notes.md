# Vercel deployment notes

Official Vercel guidance consulted on 2026-08-27:

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) states that an Express app can be deployed as a Vercel Function when an accepted application entry file exports the Express application as its default export. It also states that `express.static()` is ignored in this deployment model and static assets must be served by Vercel's static output/public handling.
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) documents Vite static deployment and recommends an SPA rewrite from `/(.*)` to `/index.html` for deep-linked client routes.
- [Vercel project configuration](https://vercel.com/docs/project-configuration) documents repository-owned `vercel.json` configuration for build, output directory, functions and routing.

For this React/Vite/Express project, a Vercel deployment therefore needs a default-exported Express serverless entry, static Vite output, API route handling before the SPA catch-all, and all server-only environment variables configured in Vercel rather than embedded in client files.

## Connected project context

- Vercel team: `Mr Fahim` (`team_zkkCRqJChhgsdpcGpRDEGU1N`).
- Existing Vercel project: `finemind-ai` (`prj_hIFilsiHI6eRpDkLsdR5dj32J1WR`).
- Git integration reported by Vercel: [`Fahim865/firstproject`](https://github.com/Fahim865/firstproject), production domain: [finemind-ai.vercel.app](https://finemind-ai.vercel.app).
- The current ready deployment returned only a bare React root shell, so the source and build/runtime configuration need to be updated before this domain can accurately serve the full application.

## Deployment validation — 2026-08-27

- Production deployment `dpl_H91NpGx6k2K1UBEXFFfFmeYTfw62` is `READY` on [finemind-ai.vercel.app](https://finemind-ai.vercel.app).
- `/` and direct `/tools` both return the Vite-built `index.html` and generated `/assets/*` client bundles. `/src/main.tsx` is no longer required by the live page.
- `/api/*` is handled by the deployed Express Function rather than the SPA fallback. An unauthenticated `auth.me` tRPC request returned HTTP 200 with `null`, which is the expected signed-out result.
- The public Google OAuth status returned `enabled: false`; Vercel runtime logs also report that `OAUTH_SERVER_URL` is not configured. Secrets were not read or included in this record.
- Consequently, the public FINEMIND AI interface and API boundary are live, but production Google sign-in and other server-backed integrations require the existing server-only environment configuration to be added in Vercel Project Settings before they can be claimed as functional.
