# Deploy GROUNDS to Vercel (Supabase required)

`https://grounds-alpha.vercel.app` returns **"This page didn't load"** when `VITE_SUPABASE_*` env vars are missing at **build time**. The root route initializes Supabase auth; without keys the React app throws before any page renders.

## Fix (Production)

In **Vercel → Project → Settings → Environment Variables**, add (from Lovable Cloud → Secrets or your Supabase project):

| Variable | Scope |
|---|---|
| `VITE_SUPABASE_URL` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development |
| `VITE_SUPABASE_PROJECT_ID` | Production, Preview, Development |

Optional server-side (TanStack SSR / server functions):

| Variable | Scope |
|---|---|
| `SUPABASE_URL` | Production |
| `SUPABASE_PUBLISHABLE_KEY` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (server only — never expose to client) |

Then **Redeploy** (env changes do not apply to past builds).

## Local build smoke test

```bash
# .env must contain VITE_SUPABASE_* (see .env.example)
npm run build
grep -q 'supabase.co' .output/public/assets/index-*.js && echo "Supabase baked OK"
```

## Auth redirect URLs

In Supabase → Authentication → URL configuration, add:

- Site URL: `https://grounds-alpha.vercel.app`
- Redirect URLs: `https://grounds-alpha.vercel.app/**`

Repeat for preview domains if using Vercel preview deploys.

## Do not use for judge demos

- `VITE_GROUNDS_DEMO=1` — local dev bypass only; never set on production Vercel.

## Judge-path film (2026-08-30)

Temporary working deploy (Supabase baked at build): `https://temporary-rapid-hawthorn-7kywpoj.vercel.app` (expires ~58 min after anonymous deploy). Rebuild with `.env` present: `npx vercel deploy --temporary --yes`.
