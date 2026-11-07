# Helpawy (React + TypeScript + Vite)
1. `npm install`  2. `npm run dev` (works at once with a browser-only demo backend)  3. `npm run build` (type-checks first).
Demo admin (local mode only): mostafamondy79@gmail.com / 123.
## Go real with Supabase
Copy `.env.example` to `.env` and fill URL + anon key. Run `supabase/schema.sql`, then `supabase/seed.sql` (loads the starter catalog). Enable "Confirm email". Sign up with the admin email using a real password (Supabase rejects "123"); the DB trigger gives it the admin role. With Supabase on, admin edits are saved to the tables for all visitors.
AI: `supabase functions deploy ai`, then `supabase secrets set ANTHROPIC_API_KEY=...`.
Layers: `src/data` seed · `src/lib` recommend + catalog · `src/services` repo + AI · `src/context` auth · `src/pages` UI. With Supabase on, user activity is stored in `profiles.state` and mirrored into registrations, saved_resources, user_tasks, progress, notifications, ai_conversations, recommendations and analytics_events (run schema.sql then seed.sql first).
