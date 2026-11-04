# FEAT-028 – Gamification implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Follow `test-driven-development` and `skills/testing/SKILL.md`; for Next.js/React use `.agents/skills/next-best-practices/SKILL.md` and `.agents/skills/vercel-react-best-practices/SKILL.md`. Keep each task test-first and complete all three RED, GREEN and REFACTOR steps before moving on. Steps use checkbox syntax for tracking.

**Goal:** Add private personal achievements and collection discovery, revocable public badge profiles, and opt-in aggregate group challenges without rankings or exposing private activity.

**Architecture:** Derive personal badges and activity aggregates from non-deleted sessions, session players, collection ownership and played series entries. Store only profile-sharing configuration and explicit challenge participation; resolve public profiles through a cryptographically random bearer token whose hash is stored. Group challenge progress is calculated as a distinct-session aggregate over participants’ opt-in intervals and is only returned to current group members. Ship the Web experience in three independently testable stages; native iOS is explicitly out of scope and needs its own plan.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma/PostgreSQL, NextAuth, Vitest/Testing Library, existing Tailwind/shadcn components, inline vector badge art.

---

## Scope and decisions

- Use the approved concept `docs/superpowers/specs/2026-11-03-FEAT-028-gamification-design.md` as the product contract. There are no public directories, rankings, streaks, penalties, push reminders, prizes, or individual challenge contributions.
- Public profile visibility is off by default. A profile shows the display name, badges explicitly selected from earned badges, and only aggregate counts for sessions, distinct games played, and completed series. It never returns email, groups, events, comments, notes, individual sessions, scores, or challenge contributions.
- Share URLs carry a 256-bit bearer token in the URL fragment (`/public/profile#…`), which browsers do not send in HTTP requests. The token is derived with HMAC-SHA256 from a random 256-bit nonce, user ID, and `NEXTAUTH_SECRET`; persist only the nonce and one-way token hash. Allow rotation/revocation, avoid caching public responses, and never log the token.
- Initial badge catalogue: first/10th/50th created session; five distinct games played as a participant; first game from the user's collection played; one fully played series. Progress is private and based on the same documented source rules as earned badges.
- Discovery starts with deterministic personal collection states: never played and not played in the last 365 days. It shows only games the user owns and can be dismissed from the discovery list without changing session history.
- Initial group challenges: record 10/25 distinct sessions or play 5/10 distinct games. A participant opts in explicitly; only non-deleted sessions created by them or containing them as a player, created after their opt-in timestamp and within the challenge period, count. Each session counts once per challenge. Opt-out freezes the participant's eligible interval; deleting/correcting a source session recalculates the aggregate. Only current members can read a challenge.
- Groups see only shared totals and target/date. Do not expose contributing member lists or member-level counts. The UI must explain that sessions logged during participation affect the shared total before opt-in.
- A session counts as personally played for game variety/discovery only when the user is in `SessionPlayer`. Created-session badges count non-deleted sessions where they are `createdById`. Historical non-deleted sessions are included when the feature launches.
- FEAT-025 compatibility: the 04.11.2026 decision is that existing series entries retain their current collection-game association and state. The “series only / temporary” option applies to newly added entries. The snapshot migration is additive; do not convert old entries to temporary ones or remove their links. Completion badges use the existing `played` state across each series entry, independent of whether an entry is collection-backed or temporary.
- Web is the implementation scope. iOS UI, public-profile deep links in iOS, and mobile challenge flows require a separate plan.

## Aktualitätsprüfung vor Umsetzung – 04.11.2026

- Finaler Freshness-Check und Umsetzungsfreigabe: 04.11.2026, HEAD `ae3cdeb`, Version `0.50.78`, sauberer Arbeitsbaum. FEAT-026 ist seit der Planerstellung committed; es berührt keine Session-, Profil-, Gruppen- oder Serienverträge.
- FEAT-025 schema source now has optional `GameSeriesEntry.gameId`, stored game snapshots, `played` state, and an additive migration that backfills existing entries while retaining their current `gameId`. Migration was not applied to production. No temporary conversion for existing entries is required by the user's clarification.
- Existing profile page is `/dashboard/profile`; it currently loads email, invites, events, groups, comments, and notes for the owner. Public output must be a new, separate DTO and query, never a reuse of this data object.
- `GameSession` has `createdById`, `createdAt`, `playedAt`, `deletedAt`, `gameId` and `SessionPlayer.userId`; group membership is represented by `GroupMember`. No direct session-to-group relation exists, so challenge totals must aggregate through explicit participant records.
- No achievement, public-user-profile, or group-challenge models/routes exist in the inspected product code. There is an authenticated `/api/users/shareable` endpoint that returns user IDs/names/emails; do not reuse it for public discovery.
- iOS models and screens are not part of this authorization.

## Files and responsibilities

- `prisma/schema.prisma`: user share setting/token nonce and hash/featured badge IDs; challenge and participant models with group/user ownership, opt-in/out times and challenge interval.
- New `src/lib/gamification/`: fixed badge catalogue, eligibility/progress calculators, profile-token generation/hash, and challenge aggregate query helpers. Keep pure rules independent from Prisma.
- New `src/lib/services/achievement.service.ts`, `profile.service.ts`, `group-challenge.service.ts`: authenticated private data, public projection, and membership-checked challenge operations.
- New APIs under `src/app/api/achievements/`, `src/app/api/users/me/public-profile/`, `src/app/api/public/profile/` (POST body token), and `src/app/api/groups/[id]/challenges/` (plus challenge-specific participant route); public page at `src/app/public/profile/page.tsx` reads the fragment client-side and submits the token in the POST body. Public pages are read-only.
- New `/dashboard/achievements` page and components for earned/locked badges, progress, and collection discovery; extend `/dashboard/profile` with badge selection, share toggle, copy-link and rotate/revoke controls.
- New public profile page at `/public/profile#<token>`; update the public event data mapper to include a profile URL only for registered participants who explicitly enabled sharing. Guest participants remain unlinked.
- New group challenge section under `/dashboard/groups/[id]`, with create/join/leave flows and group-only aggregate progress. No per-member progress endpoint.
- Tests under `tests/unit/lib/gamification/`, `tests/unit/lib/services/`, `tests/unit/api/`, and `tests/unit/components/`; PostgreSQL integration test for migration, race safety, uniqueness and aggregate query semantics.
- Update `docs/openapi.yaml`, `docs/FEATURES.md`, `src/lib/faq.ts`, `CONCEPT.md`, `src/lib/changelog.ts`, `docs/FEATURE-BACKLOG.md`, `AGENTS.md`, and the FEAT-028 plan. Add migration and deployment notes to `docs/DEPLOYMENT.md` only if the chosen migration needs a nonstandard rollout.

## Task 1 – Personal achievement rules (pure functions)

Files: `src/lib/gamification/badges.ts`, `src/lib/gamification/discovery.ts`, achievement service and unit tests under `tests/unit/lib/gamification/` and `tests/unit/lib/services/`.

- [ ] **RED:** Add tests for the badge catalogue, exact threshold boundaries (0/1/9/10/49/50 sessions), distinct played games, a played collection game, fully played versus incomplete/empty series, and soft-deleted sessions excluded from every count.
- [ ] **RED command:** `npx vitest run tests/unit/lib/gamification/badges.test.ts tests/unit/lib/gamification/progress.test.ts`; expected failure because the rules modules do not exist.
- [ ] **GREEN:** Implement a typed fixed catalogue with stable badge IDs and German title, explanation, alt text, and original inline vector icon identifier. Implement pure evaluators from explicit aggregate inputs; do not pass Prisma models to the rules.
- [ ] **GREEN command:** rerun the same command; expected all boundary and privacy-source tests pass.
- [ ] **REFACTOR:** Keep thresholds in one catalogue, keep progress computation pure and deterministic, and confirm `npx vitest run tests/unit/lib/gamification` remains green.

## Task 2 – Personal aggregates, discovery, and profile configuration

Files: `prisma/schema.prisma`, new achievement/profile services and routes, `/dashboard/achievements`, profile components; tests in API/service/component test directories.

- [ ] **RED:** Test that only owner-created non-deleted sessions count as documented sessions, only sessions with the user as `SessionPlayer` count as played games, owned collection games drive discovery, and deleted sessions disappear from progress.
- [ ] **RED:** Test profile sharing defaults off, featured badge IDs must be earned IDs, rotating/revoking invalidates the old token, and returned profile data excludes all private activity and identifiers.
- [ ] **GREEN:** Add minimal schema fields for share-enabled flag, one-way profile token hash and selected badge IDs. Implement private read/update routes and only aggregate the exact approved public profile fields using explicit Prisma selects.
- [ ] **GREEN:** Add `/dashboard/achievements` with earned and next attainable badges plus “nie gespielt” and “länger nicht gespielt” owned-game lists. Keep achievement data private and owner-scoped.
- [ ] **GREEN:** Add profile controls to turn sharing on/off, copy the link, feature only earned badges, and rotate/revoke access. Generate token material server-side with a CSPRNG, store only its hash, rate-limit public reads, use `Cache-Control: private, no-store` and redact path tokens from logs.
- [ ] **GREEN command:** `npx vitest run tests/unit/lib/gamification tests/unit/lib/services/achievement.service.test.ts tests/unit/lib/services/profile.service.test.ts tests/unit/api/achievements.test.ts tests/unit/api/public-profile.test.ts tests/unit/components/achievements-dashboard.test.tsx tests/unit/components/profile-public-sharing.test.tsx`; expected all authorization, privacy and state tests pass.
- [ ] **REFACTOR:** Split badge artwork, progress display, discovery lists and public-profile settings into components under 300 lines; type the public DTO separately from the private profile DTO.

## Task 3 – Public shareable profiles and event links

Files: `/public/profile` page with fragment token and POST API; public event server DTO and participant component; tests for public route/event output.

- [ ] **RED:** Test invalid, disabled, rotated and revoked tokens return not-found without leaking whether a user exists; enabled token returns only display name, featured earned badges and aggregate counters.
- [ ] **RED:** Test public event output includes an opaque profile URL only for registered invitees who enabled sharing; guest nicknames and non-sharing accounts have no profile URL.
- [ ] **GREEN:** Resolve public token by constant-format one-way hash, explicitly select public fields, return non-cacheable output, and never load the owner-only profile query.
- [ ] **GREEN:** Render a responsive, accessible public badge showcase with plain-language aggregate labels and no links to session/event/group details; add opt-in profile links to registered attendee names on public event pages.
- [ ] **GREEN command:** `npx vitest run tests/unit/api/public-profile.test.ts tests/unit/api/public-event-profile-links.test.ts tests/unit/components/public-profile.test.tsx tests/unit/components/public-event-client.test.tsx`; expected token privacy, guest isolation and UI tests pass.
- [ ] **REFACTOR:** Reuse badge presentation primitives only; keep public DTO mapping and public data access isolated from the private profile components.

## Task 4 – Group challenges and explicit participation

Files: `prisma/schema.prisma`, group challenge service/routes/components, migration and isolated database integration tests.

- [ ] **RED:** Test current group membership required for create/read/join/leave, owner/admin permission to create, participation opt-in timestamps, interval inclusion/exclusion, distinct session counting, 5/10 distinct games, and source-session corrections/soft deletes recalculating the aggregate.
- [ ] **RED:** Test duplicate sessions count once when several participating members are in one session; an opted-out participant's prior interval still contributes, but future sessions do not.
- [ ] **GREEN:** Add challenge model (group, kind, target, createdBy, start/end and status) and participant model (challenge, user, joinedAt, leftAt, unique challenge/user). Require current membership in every read/write route and use a transaction for membership check plus participation changes.
- [ ] **GREEN:** Aggregate distinct sessions and distinct owned/game IDs from only non-deleted records whose `createdAt` is within a participant interval and challenge period. Return challenge title, kind, target, dates, aggregate current/target and completion only; never return participant identities or per-user contribution totals.
- [ ] **GREEN:** Add group UI to create one of the fixed challenge types, see aggregate progress, opt in, and stop future participation with explicit copy before confirmation. No activity history or individual rankings.
- [ ] **GREEN command:** `npx vitest run tests/unit/lib/services/group-challenge.service.test.ts tests/unit/api/group-challenges.test.ts tests/unit/components/group-challenges.test.tsx`; expected membership, interval and aggregate checks pass. Run the separate integration test only against `BGT_TEST_DATABASE_URL`.
- [ ] **REFACTOR:** Reuse group membership guards; add the minimal indexes needed for challenge/group participants and session aggregation after checking `EXPLAIN` on isolated PostgreSQL data.

## Task 5 – Migration, security, and rendered design review

- [ ] Write the failing PostgreSQL migration test before implementation of schema/migration; apply it only to isolated `BGT_TEST_DATABASE_URL`. Verify existing FEAT-025 `GameSeriesEntry` rows retain their `gameId`, snapshot, `played` progress, order, and metadata; do not transform old rows into temporary entries.
- [ ] Generate the migration with `npx prisma migrate dev --create-only --name gamification_profiles_challenges`; inspect SQL for nullable-safe defaults, FK cascade behavior and indexes. No `db push`, baseline, or production migration.
- [ ] Run `BGT_TEST_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx vitest run --config vitest.integration.config.ts tests/integration/gamification-migration.test.ts` against an isolated local `bgt_test_*` database, then run `npm run test`, `npm run typecheck`, `npm run lint`, `npm run security-check:fast`, `npm run build`, and `npm run review-evaluate:regression`.
- [ ] Security review: IDOR and current membership checks; public profile token entropy/hash/revoke/cache/log redaction; explicit no-PII DTO; link only if sharing enabled; rate limiting; challenge opt-in, session correction, soft delete and participant exit; safe selects (never `user: true`).
- [ ] Impeccable review plus local rendered browser check with synthetic accounts and sessions: achievements with zero/one/many badges, profile private/shared/revoked, long names, 390/768/1440 px, 200% zoom, light/dark, keyboard and reduced motion. Verify there are no public/private data leaks in DOM or network payloads. No production account/data.
- [x] Updated OpenAPI, feature guide, FAQ, concept, version/changelog, backlog, deployment note and plan. No new bug was found.
- [x] Used isolated local `bgt_test_feat028`; updated review snapshot, evaluation, process and regression docs. No production database was accessed.
- [ ] Commit code and docs with regular hooks after all implementation checks pass.

## Umsetzungsstand – 04.11.2026

Die Umsetzung wurde lokal gegen `bgt_test_feat028` getestet; die FEAT-028-Implementierung verwendete keine Produktionsdaten. Nach gemeldetem Produktionsfehler wurde am 04.11.2026 vor dem Migrationseinsatz ein lesbares Backup erstellt. Der Produktionsstatus zeigte drei offene Migrationen: BUG-053-Gastnachweis, FEAT-025-Reihensnapshots und FEAT-028-Gamification. Alle drei wurden mit `npm run prisma:deploy` angewendet. Anschließend meldeten `prisma migrate status` „Database schema is up to date“; die vier FEAT-028-Profilspalten, drei neuen Tabellen und drei abgeschlossenen Migrationseinträge wurden read-only bestätigt. Der FEAT-025-Migrationsschritt backfillt Snapshots und entkoppelt bereits gelöschte Sammlungsspiele; aktive bestehende Spielverknüpfungen bleiben erhalten. Eine read-only Produktionszählung bestätigte alle 25 vorhandenen Reiheneinträge weiterhin als `COLLECTION` und keine temporären Bestandsumwandlungen.

## Freigabestatus

The user requested implementation on 04.11.2026 and explicitly approved this exact plan after review. Approved: three Web stages described above; native iOS remains separate. The FEAT-025 clarification preserves every existing collection-backed series entry; only new entries may be temporary. Production migrations and production data are excluded.
