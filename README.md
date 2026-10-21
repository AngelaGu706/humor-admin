# NYC Food Spots · Admin

Week 6 administrator app for [NYC Food Spots](https://github.com/AngelaGu706/hello-world), built with Next.js, React, and the existing Supabase database.

## Features

- Overview: exact community totals, approval rate, 14-day creation chart, favorite content, and popular neighborhoods.
- People: paginated read-only profiles and administrator status.
- AI content: create, read, update, and delete food picks. Existing structured JSON and legacy Markdown are preserved.
- Ratings: paginated, read-only upvote/downvote records with content titles and member names.
- Google login and live database administrator checks on every protected page/data loader and mutation endpoint.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the SAME Supabase URL and publishable key as the original app. No service-role key is needed.
3. In the existing Supabase project's SQL editor, review and run `supabase/migrations/20261021_admin_panel.sql` as the database owner.
4. Find your own verified Google account in Authentication → Users. Copy its UUID. In the SQL editor, run this with that exact UUID:

   ```sql
   update public.profiles set is_superadmin = true where id = '<YOUR_AUTH_USER_UUID>';
   ```

5. Add `http://localhost:3000/auth/callback` to the Supabase redirect allowlist if it is not already there.
6. Run `npm run dev` and open `http://localhost:3000`.

The first administrator is assigned directly by the database owner; there is no public signup or profile-editing path that grants administrator privileges. The app stays closed until its security migration is installed.

## Vercel deployment

1. Import this repository as a NEW Vercel project.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, using the same public values as the original app, then deploy.
3. Add the new production domain's `/auth/callback` URL and the submitted commit-specific deployment URL's `/auth/callback` to the existing Supabase project's redirect allowlist. Keep the original app's Site URL and redirects.
4. Sign in with your verified Google administrator account.
5. For the assignment, disable Vercel Deployment Protection on the submitted deployment. Application-level Google login and administrator authorization remain required.
6. Submit the latest commit-specific deployment URL of BOTH the original app and this admin app.

## Permissions

The migration enables RLS and adds narrowly scoped administrator policies: read profiles and votes; create/read/update/delete generations. Existing ordinary-user policies remain. A trigger blocks API users from inserting or changing administrator flags, including through the existing profile editor. The administrator check uses a fixed-search-path database function tied to `auth.uid()`. Statistics run over the full database with invoker permissions and an explicit administrator check, avoiding API row-limit undercounts.

Existing ordinary-user policies should also be reviewed in Supabase. The migration adds admin policies; it does not remove existing policies or cure unrelated pre-existing grants.

Deletes require typing the content's title in the UI. They are permanent; dependent votes or saved picks may cascade according to existing foreign keys. Do not test deletion against real content.

## Verification

- `npm test`: authorization matrix, role revocation, content validation, and mutation endpoint protection.
- `npm run lint`
- `npm run build`

The migration has additionally been tested in an isolated PostgreSQL-compatible database against 1,102 content records, including ordinary-user self-promotion denial, admin CRUD, denied anonymous access, exact statistics, repeat installation, and role revocation. This does not replace checking the actual production policies after installation.

No private credentials belong in Git. `.env.local` is ignored.
