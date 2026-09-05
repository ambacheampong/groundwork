# Groundwork

Scholarships, fellowships, internships, jobs and freelance work for students
and young professionals — one feed, verified sources.

Built with TanStack Start, React 19, Tailwind, Supabase, and Capacitor
(Android/iOS). No third-party app-builder platform — this is a plain project
you run, build, and deploy yourself.

## Requirements

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project (this one already has a project set up — see `.env.example`)
- An [OpenRouter](https://openrouter.ai) API key (only needed for the AI-powered listing ingestion feature)
- A [Firecrawl](https://firecrawl.dev) API key (also only needed for ingestion)

## Local development

```sh
npm install
cp .env.example .env   # then fill in the values, see below
npm run dev
```

The app runs at http://localhost:3000.

## Environment variables

See `.env.example` for the full list. In short:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — public, safe to expose client-side
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` — same values, read server-side
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**, server-only, bypasses row-level security. Get it from your Supabase project settings → API.
- `OPENROUTER_API_KEY` — for AI-powered listing extraction
- `FIRECRAWL_API_KEY` — for crawling source pages during ingestion

## Google sign-in

Google OAuth now goes directly through Supabase rather than a third-party
broker. You'll need to configure the Google provider yourself in your
Supabase project: **Authentication → Providers → Google**, with your own
Google Cloud OAuth client ID/secret.

## Deployment

Configured to deploy to **Vercel**. Push this repo to GitHub, then import it
in Vercel — it auto-detects the Vite/TanStack Start build. Set the same
environment variables from `.env.example` in the Vercel project settings.

## Mobile (Android / iOS)

The native apps load your deployed web app inside a Capacitor WebView.
Update `capacitor.config.ts`'s `server.url` to your real deployed URL once
you've deployed, then:

```sh
npm run mobile:sync
npm run mobile:open:android   # opens Android Studio
npm run mobile:open:ios       # opens Xcode (macOS only)
```

See `MOBILE_README.md` for more detail.
