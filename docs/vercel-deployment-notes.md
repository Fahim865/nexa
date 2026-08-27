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

## Sign-in diagnosis follow-up — 2026-08-27

- The live `/sign-in` page confirms that the Google button is inactive because server-only Google OAuth configuration is unavailable to the Vercel Function.
- The connected browser reached Vercel's login screen instead of the project environment-variable settings page, so the Vercel dashboard session must be authenticated before its existing server-only variables can be entered or verified. Secret values were neither viewed nor recorded.

## Browser access verification — 2026-08-27

- The logged-in Vercel browser can open the `Mr Fahim` workspace and the `finemind-ai` production overview, which reports the production deployment as Ready.
- Navigating directly to `https://vercel.com/mr-fahim/finemind-ai/settings/environment-variables` still returns Vercel's login screen, despite the overview session. The environment-variable names and values therefore remain inaccessible by browser automation and were not viewed.
- A secret-free tRPC request to `https://finemind-ai.vercel.app/api/trpc/auth.googleStatus` returns HTTP 200 with `enabled: false` and the unavailable reason that server-side OAuth configuration is required.

## Build-warning follow-up — 2026-08-27

- Latest READY production build emitted two occurrences of the same pnpm warning because Vercel runs dependency installation twice: native build scripts for `@tailwindcss/oxide` and `esbuild` were not allowlisted. The deployment completed successfully, but the warning obscures real build failures.
- pnpm documents `allowBuilds` as the scoped policy for approving dependency build scripts in `pnpm-workspace.yaml`; this project now declares only the two required packages, alongside the root workspace entry, existing `wouter` patch mapping, and `tailwindcss>nanoid` override. See [pnpm settings](https://pnpm.io/settings) and [`pnpm approve-builds`](https://pnpm.io/cli/approve-builds).
- Vite also emitted a non-blocking 500 kB asset warning. The largest minified chunks were the PDF utility route (539.03 kB) and initial application entry (563.67 kB), with gzip output approximately 165–168 kB. PDF.js is now loaded only when the PDF Page Counter runs, and the warning threshold is narrowly set to 600 kB to prevent noisy warnings while retaining a safety signal for materially larger bundles.

## Latest production verification — 2026-08-27

- Production deployment `dpl_ErmMEQbq1dKGQPVYK72QutG7yxVY` is `READY` and is aliased to [finemind-ai.vercel.app](https://finemind-ai.vercel.app). Its build completed after the native-build approval policy, cookie cleanup, route-level code splitting, and vendor chunk split changes.
- Local production validation passed: `pnpm check`, all 25 Vitest files / 83 tests, and `pnpm build`. The final build generated no Vite size-warning message; the initial `index` chunk is 515.53 kB and the browser-local PDF reader remains a lazy 489.71 kB chunk.
- The public `subscription.catalog` query returns HTTP 200 with `monthlyPriceUsd: 10` and `monthlyCreditAllowance: 5000`. No checkout or payment claim follows from this configuration-only endpoint.
- The FINEMIND circular badge request under `/manus-storage/finemind-ai-circular-badge_6c5f776e.png` returns a Vercel 307 redirect to the managed asset CDN, rather than returning SPA HTML.
- The public `auth.googleStatus` query currently returns `enabled: false` with the unavailable reason that server-side OAuth configuration is required. This is a production environment configuration blocker, not a client-side source-code or logo-routing regression. Secret values were not read or recorded.
