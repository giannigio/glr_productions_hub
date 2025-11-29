<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1k3mK-MHDNMLm0XkHeBKxcx6mk6uuZxoj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase setup

The app now supports Supabase (cloud or local via CLI) for auth, RLS-secured data and storage.

1. **Create/Start a project**
   - Cloud: create a project and copy the Project URL and `anon` / `service_role` keys.
   - Local CLI: run `npm run supabase:start` (requires [Supabase CLI](https://supabase.com/docs/guides/cli) installed) to start the local stack. The CLI prints the project URL and anon/service keys.

2. **Configure environment**
   - Copy `.env.example` to `.env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (frontend). For secure backend scripts, use `VITE_SUPABASE_SERVICE_ROLE_KEY`.
   - Restart Vite dev server after updating env vars.

3. **Database schema & seed**
   - Apply migrations: `npm run supabase:db:push` (cloud) or `npm run supabase:db:reset` (local).
   - Seed demo data for development: `npm run supabase:db:seed` (runs `supabase db reset --seed`). Seeds create demo profiles, jobs, rentals, etc.

4. **Auth & security**
   - RLS is enabled on all tables. Policies grant read access to authenticated users and write access to `ADMIN` / `MANAGER` roles via `public.has_role`.
   - Login supports password auth and (when Supabase is configured) an email magic link directly from the login screen.

5. **Storage**
   - A private bucket `private-media` is provisioned by the migration with policies allowing authenticated reads and admin/manager writes. Use signed URLs for private objects.

6. **Shared client**
   - The Supabase client is centralised in `services/supabaseClient.ts` and is reused by the API layer. Sessions auto-refresh in the frontend.
