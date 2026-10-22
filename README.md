# Collivio

Collivio is a full-stack student ecosystem: opportunities, research collaboration,
a media lab, communities, events, shared resources and student profiles, plus a
business portal and an admin trust center.

It is a single Next.js App Router application with a PostgreSQL database and a
private object-storage bucket for uploaded files.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, TypeScript strict) |
| Styling | Tailwind CSS, shadcn/ui (Base UI), Lucide icons |
| Database | Neon PostgreSQL with Drizzle ORM (`neon-http` driver) |
| Auth | Neon Auth + server-side session helpers |
| Validation | Zod |
| Files | Private S3-compatible bucket, presigned uploads and signed reads |
| Tests | Vitest |
| Deploy | Vercel-compatible |

## Features

- **Bento dashboard** (`/dashboard`) with profile strength, recommended
  opportunities, upcoming events, research, media, discussions, applications,
  suggested students and notifications.
- **Opportunities** with types, eligibility, required documents, deadlines,
  bookmarking and applications. Only verified and approved organizations can
  publish (enforced both in server actions and in pure authorization rules).
- **Research Hub** with project pages, tech stacks, links, cover images,
  collaboration requests and contributor permissions.
- **Media Lab** with image-first posts, likes, albums and private-bucket signed
  image URLs.
- **Communities & discussions** with membership, join policies, moderation roles
  and replies.
- **Events** with registration and capacity, **Resource Library** with uploaded
  files or links, and **student profiles** with skills, links and visibility.
- **Messages, notifications and bookmarks** (in-app only; no email provider is
  connected).
- **Business portal** for organization registration, verification requests,
  listings and applicant management with private notes and status transitions.
- **Admin & Trust Center** for organization verification, reports and platform
  moderation. Admins are provisioned only through the `ADMIN_EMAILS` allowlist.
- **Demo seed** with 8 opportunities, 6 research projects, 8 media posts with
  placeholder images, 6 communities, 6 discussions, 5 events, 6 resources and 8
  synthetic student profiles.

## Routes

Public:

- `/` — marketing site
- `/auth/sign-in`, `/auth/signup` — authentication
- `/account-suspended` — suspended-account notice

Authenticated (`(app)` layout, guarded by `requireProfile()`):

| Route | Purpose |
| --- | --- |
| `/dashboard` | Bento home |
| `/explore` | Cross-module discovery |
| `/opportunities`, `/opportunities/new`, `/opportunities/[id]` | Listings, create, detail + apply |
| `/research`, `/research/new`, `/research/[id]`, `/research/[id]/edit` | Research hub |
| `/media` | Media Lab |
| `/communities`, `/communities/[slug]`, `/discussions/[id]` | Communities and threads |
| `/events`, `/events/new`, `/events/[id]` | Events |
| `/resources` | Resource library |
| `/students`, `/students/[id]` | Student directory and profiles |
| `/applications`, `/bookmarks`, `/notifications` | Personal activity |
| `/messages`, `/messages/[id]` | Direct messages |
| `/profile`, `/settings` | Account settings |
| `/business` | Business portal (business/admin roles) |
| `/admin` | Admin dashboard: queues, KPIs, recent activity (admin role) |
| `/admin/organizations` | Business verification queue and decisions |
| `/admin/reports` | Report moderation queue and resolution history |
| `/admin/users` | Member search, filters and suspension controls |
| `/admin/content` | Read-only content pulse across modules |

## Architecture

- `src/app/(app)/layout.tsx` protects every application route on the server.
- `src/app/actions.ts` contains the server actions. Each action re-authenticates,
  authorizes, validates with Zod and only then mutates the database.
- `src/lib/authz.ts` holds pure permission rules (role checks, organization
  verification, application transitions, project visibility, moderation). It has
  no database or framework imports, so it is unit tested directly.
- `src/lib/auth/session.ts` reads the Neon Auth session, creates the matching
  profile on first visit and exposes `requireProfile`, `requireRole`,
  `requireAdmin` and `requireBusiness`.
- `src/lib/db/schema.ts` defines the Drizzle schema (about 30 tables).
- `src/lib/storage.ts` implements the private-bucket flow:
  - uploads use a short-lived presigned `PUT`,
  - the database stores `s3://<bucket>/<key>` references,
  - reads are converted to one-hour signed URLs at render time,
  - external `https://` URLs continue to work unchanged.
- `src/app/api/uploads/presign/route.ts` authenticates the caller, scopes keys to
  the user (`media/<profileId>/...`, `documents/<profileId>/...`) and validates
  type and size.

### Authorization highlights

- Only an organization owner with `verified = true` and
  `verificationStatus = "approved"` can publish opportunities. Admins may act on
  any organization. Draft creation is allowed but publishing is blocked until
  verification.
- Admin role is assigned from `ADMIN_EMAILS`, never from registration order.
- Application status changes use an explicit transition table. Terminal states
  cannot move again.
- Private application documents are visible only to the applicant and the owning
  organization (or an admin).

## Environment variables

See `.env.example` for the full annotated list.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon pooled Postgres connection string |
| `NEON_AUTH_BASE_URL` | Yes | Neon Auth instance URL |
| `NEON_AUTH_JWKS_URL` | Yes | JWKS URL for JWT verification |
| `NEON_AUTH_COOKIE_SECRET` | Yes | 32+ random characters |
| `BETTER_AUTH_SECRET` | Yes | Auth signing secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin |
| `ADMIN_EMAILS` | No | Comma-separated admin allowlist |
| `S3_ENDPOINT` | For uploads | S3-compatible endpoint |
| `S3_REGION` | For uploads | Defaults to `auto` |
| `S3_BUCKET` | For uploads | One **private** bucket |
| `S3_ACCESS_KEY_ID` | For uploads | Bucket credentials |
| `S3_SECRET_ACCESS_KEY` | For uploads | Bucket credentials |
| `S3_FORCE_PATH_STYLE` | No | `true` for MinIO-style endpoints |
| `ALLOW_SEED` | No | Required to seed with `NODE_ENV=production` |

If the storage variables are absent, the app still runs: upload widgets fall back
to a pasted URL field instead of direct uploads.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run db:migrate           # fresh database
npm run dev
```

Open <http://localhost:3000> and create an account at `/auth/signup`.

### Database

- `npm run db:generate` — generate SQL migrations into `drizzle/`
- `npm run db:migrate` — apply migrations to `DATABASE_URL`
- `npm run db:push` — push the schema directly (used during initial development)
- `npm run db:studio` — Drizzle Studio

A baseline migration is committed at `drizzle/0000_furry_martin_li.sql`. The
development database used during the build was schema-pushed before the
migration existed, so the baseline was recorded as applied (without re-running
it). `npm run db:migrate` is now a safe no-op on that database and applies
normally on a fresh one.

### Demo data

```bash
npm run seed
# production requires an explicit opt-in:
# ALLOW_SEED=true npm run seed
```

The seed is idempotent (deterministic IDs, `onConflictDoNothing`) and uses
synthetic profiles that **cannot log in**. Sign up normally to get a real
account. Seed content is global, so it appears in the dashboard of real users.

### Object storage

1. Create one private bucket and restrict public access.
2. Create credentials limited to that bucket.
3. Set the `S3_*` variables.
4. Allow browser `PUT` requests from your app origin in the bucket CORS policy
   (`PUT`, `GET`, `HEAD`; allow `Content-Type`).
5. Optionally set a lifecycle rule for incomplete multipart uploads.

The app never serves the bucket publicly. Every stored object is read through a
short-lived signed URL.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run seed       # seed demo data
```

## Testing

Vitest covers the pure authorization rules (`src/lib/__tests__/authz.test.ts`)
and Zod form schemas (`src/lib/__tests__/validation.test.ts`).

The current suite contains **31 passing tests** across 2 files.

## Deployment (Vercel)

1. Import the repository and set every environment variable from `.env.example`.
2. Point `DATABASE_URL` at the Neon database and run `npm run db:migrate`
   against it once (locally or from CI).
3. Ensure `NEXT_PUBLIC_APP_URL` is the production origin and add it to the Neon
   Auth allowed URLs.
4. Configure bucket CORS for the production origin.
5. Deploy. Do **not** run the seed against production unless you deliberately
   set `ALLOW_SEED=true`.

## Known limitations

- **Email delivery is not configured.** Notifications are in-app rows only.
- **No realtime transport** is configured for messages; pages refresh on
  navigation.
- **Object storage requires credentials.** Until they are supplied, direct
  uploads are disabled and only pasted URLs work.
- **No rate limiting** is applied to messages, uploads or reports yet.
- **Demo profiles cannot authenticate**; they exist only to populate content.
- **Object storage is not configured** on the current deployment; media posts
  use external placeholder URLs and upload fields fall back to pasted URLs.
