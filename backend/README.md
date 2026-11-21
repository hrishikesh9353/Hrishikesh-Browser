# Hrishikesh API

This is the hosted API for signed-in profile sync, HRX AI requests, and support tickets. It uses Supabase Auth to verify user access and Supabase Postgres to save data. The Supabase service-role key stays on the server.

## Local health check

1. Copy `.env.example` to `.env` and fill the Supabase and AI settings.
2. Set those environment values in PowerShell or your hosting dashboard. The server does not read `.env` automatically.
3. Run `npm start` from this folder.
4. Open `http://127.0.0.1:3000/health`.

The API requires an authenticated Supabase access token for `/api/*` routes. The account sign-in screen in the browser still needs to be connected to Supabase before users can use profile sync and support reporting.

## Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. The schema has per-user browser profiles, AI conversation records, and support tickets. Row-level security is on; the API verifies the user token before using its server-only database key.

## Deploy preview

This folder contains a Render Blueprint for a small preview service. Connect the public GitHub repository in Render, choose the `backend/render.yaml` blueprint, and add each requested environment value in the dashboard. Never put the Supabase service-role key or AI key in frontend code or GitHub.

The free web service can sleep while idle, so first requests may be delayed. Use a paid always-on service before relying on it for public users. The hosted AI endpoint must point to a reachable OpenAI-compatible model service; Ollama on the developer's laptop is not reachable by the hosted server.
