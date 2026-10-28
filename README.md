# AI Workspace · Admin

Week 7 adds a course AI observability workspace to the Week 6 [NYC Food Spots](https://github.com/AngelaGu706/hello-world) administrator app. Built with Next.js, React, and Supabase.

## Live food generation traces

The food frontend now records its actual generation pipeline in the same food Supabase project used by this admin. `/admin/requests` lists the submitted input, selected cuisine/neighborhood, status, duration, and result. Each detail page links the input to the actual prompt steps, Gemini responses and saved recommendation. `/admin/media` links each newly generated pick back to its trace. The food overview displays recent requests.

Install the additive migration in the [food app repository](https://github.com/AngelaGu706/hello-world/blob/main/supabase/migrations/20261028_food_observability.sql) before deploying the updated apps. New tables are readable only by existing food superadmins. RPCs derive write ownership from the caller and complete the trace and recommendation in one transaction. Neither frontend nor admin uses a service-role key.

Historical and manually created recommendations have no recorded trace; these are labeled honestly. A trace keeps the original output if the displayed pick is edited or deleted later. Course teaching data remains a separate workspace and is not presented as food generation activity.

## Course workspace (Week 7)

The root URL opens the live food workspace at `/admin`. The course workspace is available at `/studio`. Food management remains at `/admin`; each workspace has its own Google session and database administrator check.

The course workspace reads the existing teaching database, not the food database. It does not manufacture food-app generation traces or copy teaching records into the original app.

| Feature | Existing course table | Operations |
| --- | --- | --- |
| Users | profiles | Read |
| Prompt chain runs | llm_prompt_chains | Read |
| Chain templates | humor_flavors | Read |
| Prompt steps | humor_flavor_steps | Read |
| Chain mix | humor_flavor_mix | Read, update |
| Terms | terms | Create, read, update, delete |
| AI content | captions | Read |
| Generation requests | caption_requests | Read |
| Generation examples | caption_examples | Create, read, update, delete |
| Models | llm_models | Create, read, update, delete |
| Providers | llm_providers | Create, read, update, delete |
| Model responses | llm_model_responses | Read |
| Signup domains | allowed_signup_domains | Create, read, update, delete |
| Email whitelist | whitelist_email_addresses | Create, read, update, delete |
| Images | images | Read, view |

Lists support search and pagination. Record detail pages link requests, chain runs, model responses, prompts, images, and generated captions. Forms use foreign-key selectors, server-side field allowlists, type checks, audit defaults, and optimistic concurrency checks. A conflicting edit is rejected rather than overwriting a newer version. Foreign-key violations return a recoverable message.

Neither the food app nor the inspected Funnystudy front end provides an image upload flow. Existing course images are viewable; the conditional image-upload requirement is not enabled.

### Course connection

1. Configure `COURSE_SUPABASE_URL` and `COURSE_SUPABASE_PUBLISHABLE_KEY` with the existing course project. These two values are used only by server code. No service-role key is used.
2. Preserve the course database's existing RLS policies. All course queries run with the signed-in user's JWT. The workspace verifies Google identity and the current boolean `profiles.is_superadmin` flag on every loader and mutation.
3. The database owner must assign the intended Google account the existing superadmin role. The UI cannot grant administrator privileges or edit profiles.
4. Add the desired deployment's `/auth/course/callback` URL to that course project's redirect allowlist. For local testing, add `http://127.0.0.1:3017/auth/course/callback`. Keep the existing Site URL and Funnystudy redirects.
5. Sign in at `/course-login`. Course sign-out does not remove the separate food session.

Teaching data remains historical course data. Read counts reflect the database, including its imported records.

## Food workspace (Week 6)

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

In restricted local environments, `npm run build -- --webpack` avoids Turbopack's temporary worker-port requirement. The course checks additionally cover resource/field allowlists, role revocation, denied anonymous and cross-origin mutations, validation, version conflicts, and database constraint errors. The actual teaching table definitions, identity IDs, audit defaults, and foreign keys were also exercised in an isolated local PostgreSQL-compatible database for all six CRUD resources and mix updates.

The migration has additionally been tested in an isolated PostgreSQL-compatible database against 1,102 content records, including ordinary-user self-promotion denial, admin CRUD, denied anonymous access, exact statistics, repeat installation, and role revocation. This does not replace checking the actual production policies after installation.

No private credentials belong in Git. `.env.local` is ignored.
