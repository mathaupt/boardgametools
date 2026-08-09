# Native iOS-App — Backend API Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Each task produces committed, working, testable software. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/api/mobile/v1/*` REST API foundation that the native iOS-App consumes. The API reuses the existing `src/lib/services/*` business logic, adds API-token authentication, a sync endpoint, and covers the MVP domains (games, sessions, events, groups, public share links, uploads, push).

**Architecture:** New `src/app/api/mobile/v1/` route handlers call `src/lib/services/*` and `src/lib/api-auth.ts`. `src/lib/token-service.ts` generates/verifies/rotates opaque Bearer tokens. `src/proxy.ts` skips CSRF for Bearer requests. Prisma schema adds `ApiToken` and `PushDevice` models. Unit tests use Vitest and `tests/unit/api/helpers.ts`.

**Tech Stack:** Next.js 16.3.0, TypeScript 6.0.3, Prisma 7.9.1, NextAuth v5, `bcryptjs`, `crypto`.

---

<!-- TASKS_START -->

### Task 1: Prisma-Schema um `ApiToken` und `PushDevice` erweitern

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/unit/lib/token-service.test.ts` (vorbereiten, läuft nach Task 2)

- [ ] **Step 1: Ergänze die beiden neuen Modelle und die `User`-Relationen**

Füge im `prisma/schema.prisma` über die Sektionen-Header (z.B. oberhalb von `// GAMES`) ein:

```prisma
// ============================================
// MOBILE AUTH & PUSH
// ============================================

model ApiToken {
  id          String    @id @default(cuid())
  userId      String
  type        String    @default("access")
  name        String    @default("iOS App")
  tokenHash   String    @unique
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}

model PushDevice {
  id          String    @id @default(cuid())
  userId      String
  deviceToken String
  platform    String    @default("ios")
  appVersion  String?
  locale      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceToken])
  @@index([userId])
}
```

Ergänze im `User`-Modell die Gegenrelationen:

```prisma
  apiTokens   ApiToken[]
  pushDevices PushDevice[]
```

- [ ] **Step 2: Migration anlegen und Client generieren**

```bash
npx prisma migrate dev --name add_mobile_auth_and_push
npx prisma generate
```

Expected: Migration-Ordner unter `prisma/migrations/` und `src/generated/prisma` enthält die neuen Typen.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/generated/prisma
git commit -m "feat: ApiToken und PushDevice Modelle für mobile Auth/Push"
```

---

### Task 2: Token-Service erstellen

**Files:**
- Create: `src/lib/token-service.ts`
- Create: `tests/unit/lib/token-service.test.ts`

- [ ] **Step 1: Schreibe den fehlenden Test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTokenPair, rotateTokenPair, revokeToken, hashToken } from "@/lib/token-service";
import prisma from "@/lib/db";

vi.mock("@/lib/db", () => ({
  default: {
    apiToken: {
      create: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("token-service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("creates an access and refresh token pair", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: "1" }, { id: "2" }]);
    const result = await createTokenPair("user-1", "iPhone von Max");
    expect(result.accessToken).toHaveLength(64);
    expect(result.refreshToken).toHaveLength(64);
    expect(result.expiresAt instanceof Date).toBe(true);
  });

  it("rotates a refresh token", async () => {
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue({
      id: "rt-1", type: "refresh", userId: "user-1", revokedAt: null, expiresAt: new Date(Date.now() + 86400000), user: { id: "user-1" },
    } as never);
    vi.mocked(prisma.apiToken.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: "2" }, { id: "3" }]);
    const result = await rotateTokenPair("some-refresh-token");
    expect(result).not.toBeNull();
    expect(prisma.apiToken.update).toHaveBeenCalledWith(expect.objectContaining({ data: { revokedAt: expect.any(Date) } }));
  });
});
```

- [ ] **Step 2: Test sollte fehlschlagen**

```bash
npm run test -- tests/unit/lib/token-service.test.ts
```

Expected: `FAIL` weil `src/lib/token-service.ts` nicht existiert.

- [ ] **Step 3: Implementiere `src/lib/token-service.ts`**

```typescript
import { randomBytes, createHash } from "crypto";
import prisma from "@/lib/db";

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export function generatePlainToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createTokenPair(userId: string, name = "iOS App"): Promise<TokenPair> {
  const accessPlain = generatePlainToken();
  const refreshPlain = generatePlainToken();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.apiToken.create({
      data: {
        userId,
        type: "access",
        name,
        tokenHash: hashToken(accessPlain),
        expiresAt,
      },
    }),
    prisma.apiToken.create({
      data: {
        userId,
        type: "refresh",
        name,
        tokenHash: hashToken(refreshPlain),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);

  return { accessToken: accessPlain, refreshToken: refreshPlain, expiresAt };
}

export async function rotateTokenPair(refreshPlain: string, name = "iOS App"): Promise<TokenPair | null> {
  const hash = hashToken(refreshPlain);
  const existing = await prisma.apiToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!existing || existing.type !== "refresh" || existing.revokedAt || (existing.expiresAt && existing.expiresAt < new Date())) {
    return null;
  }

  await prisma.apiToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return createTokenPair(existing.userId, name);
}

export async function revokeToken(plain: string): Promise<void> {
  const hash = hashToken(plain);
  await prisma.apiToken.updateMany({
    where: { tokenHash: hash },
    data: { revokedAt: new Date() },
  });
}
```

- [ ] **Step 4: Test erneut ausführen**

```bash
npm run test -- tests/unit/lib/token-service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/token-service.ts tests/unit/lib/token-service.test.ts
git commit -m "feat: Token-Service für mobile API-Auth"
```

---

### Task 3: `apiAuth`-Helfer und `proxy.ts` anpassen

**Files:**
- Create: `src/lib/api-auth.ts`
- Create: `tests/unit/lib/api-auth.test.ts`
- Modify: `src/proxy.ts`

- [ ] **Step 1: Test für `apiAuth` schreiben**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  default: { apiToken: { findUnique: vi.fn(), update: vi.fn() } },
}));

describe("apiAuth", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns web session when NextAuth session exists", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", email: "a@b.c", name: "Max" } } as never);
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me");
    const result = await apiAuth(req);
    expect(result?.user.id).toBe("u1");
  });

  it("returns null for missing authorization header", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me");
    const result = await apiAuth(req);
    expect(result).toBeNull();
  });

  it("resolves bearer token to user", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue({
      id: "t1", type: "access", revokedAt: null, expiresAt: new Date(Date.now() + 10000),
      user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" },
    } as never);
    const token = "a".repeat(64);
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = await apiAuth(req);
    expect(result?.user.id).toBe("u1");
  });
});
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
npm run test -- tests/unit/lib/api-auth.test.ts
```

- [ ] **Step 3: `src/lib/api-auth.ts` implementieren**

```typescript
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { hashToken } from "@/lib/token-service";
import type { NextRequest } from "next/server";

export interface ApiSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export async function apiAuth(request: NextRequest): Promise<ApiSession | null> {
  const webSession = await auth();
  if (webSession?.user?.id) {
    return {
      user: {
        id: webSession.user.id,
        email: webSession.user.email ?? "",
        name: webSession.user.name ?? null,
        role: (webSession.user as any).role ?? "USER",
      },
    };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  if (
    !apiToken ||
    apiToken.type !== "access" ||
    apiToken.revokedAt ||
    (apiToken.expiresAt && apiToken.expiresAt < new Date())
  ) {
    return null;
  }

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: {
      id: apiToken.user.id,
      email: apiToken.user.email,
      name: apiToken.user.name,
      role: apiToken.user.role,
    },
  };
}
```

- [ ] **Step 4: `src/proxy.ts` um Bearer-Ausnahme ergänzen**

In der Mutation-CSRF-Prüfung, direkt am Anfang des `if`-Blocks:

```typescript
  if (
    MUTATION_METHODS.has(req.method) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/public/")
  ) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      return; // API-Token-Authentifizierung ist nicht CSRF-anfällig
    }
    // ... bestehende CSRF-Logik
```

- [ ] **Step 5: Tests laufen lassen**

```bash
npm run test -- tests/unit/lib/api-auth.test.ts
npm run test -- tests/unit/proxy.test.ts
```

Falls `tests/unit/proxy.test.ts` nicht existiert, lege es an und teste, dass `proxy` bei `Authorization: Bearer` keinen CSRF-Fehler liefert.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api-auth.ts tests/unit/lib/api-auth.test.ts src/proxy.ts
git commit -m "feat: apiAuth Helper und Bearer-Ausnahme in proxy.ts"
```

### Task 4: Mobile Auth-Routen (`/api/mobile/v1/auth/*`)

**Files:**
- Create: `src/app/api/mobile/v1/auth/login/route.ts`
- Create: `src/app/api/mobile/v1/auth/refresh/route.ts`
- Create: `src/app/api/mobile/v1/auth/logout/route.ts`
- Create: `src/app/api/mobile/v1/auth/logout-all/route.ts`
- Modify: `src/lib/error-messages.ts`

- [ ] **Step 1: Fehlende Fehlermeldung ergänzen**

In `src/lib/error-messages.ts` zur `Errors`-Map hinzufügen:

```typescript
INVALID_CREDENTIALS: "Ungültige Anmeldedaten",
```

- [ ] **Step 2: Tests schreiben**

Create `tests/unit/api/mobile/v1/auth/login.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as LoginPOST } from "@/app/api/mobile/v1/auth/login/route";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";
import { createMockRequest, parseResponse } from "../../../../helpers";

vi.mock("@/lib/db", () => ({
  default: { user: { findUnique: vi.fn() } },
}));
vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/token-service", () => ({
  createTokenPair: vi.fn(() => ({ accessToken: "at", refreshToken: "rt", expiresAt: new Date() })),
}));

describe("POST /api/mobile/v1/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 for unknown user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    const req = createMockRequest("POST", "http://localhost:3000/api/mobile/v1/auth/login", { body: { email: "x@y.z", password: "pw" } });
    const res = await (LoginPOST as Function)(req);
    expect(parseResponse(res).status).toBe(401);
  });
});
```

- [ ] **Step 3: Login-Route implementieren**

`src/app/api/mobile/v1/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/db";
import { createTokenPair } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError, ApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      throw new ApiError(400, Errors.MISSING_REQUIRED_FIELDS);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new ApiError(401, Errors.INVALID_CREDENTIALS);
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, Errors.INVALID_CREDENTIALS);
    }

    const tokens = await createTokenPair(user.id);
    return NextResponse.json({
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 4: Refresh-Route implementieren**

`src/app/api/mobile/v1/auth/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { rotateTokenPair } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError, ApiError } from "@/lib/require-auth";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) throw new ApiError(400, "Refresh-Token fehlt");
    const tokens = await rotateTokenPair(refreshToken);
    if (!tokens) throw new ApiError(401, "Ungültiger Refresh-Token");
    return NextResponse.json(tokens);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 5: Logout-/Logout-All-Routen implementieren**

`src/app/api/mobile/v1/auth/logout/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { revokeToken } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new handleApiError(new Error("Unauthorized"));
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) await revokeToken(token);
    return NextResponse.json({ message: "Erfolgreich abgemeldet" });
  } catch (error) {
    return handleApiError(error);
  }
});
```

`src/app/api/mobile/v1/auth/logout-all/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.apiToken.updateMany({
      where: { userId: session.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ message: "Alle Sitzungen beendet" });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 6: Tests laufen lassen**

```bash
npm run test -- tests/unit/api/mobile/v1/auth/login.test.ts
npm run test -- tests/unit/api/mobile/v1/auth/refresh.test.ts
npm run test -- tests/unit/api/mobile/v1/auth/logout.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/mobile/v1/auth src/lib/error-messages.ts tests/unit/api/mobile/v1/auth
git commit -m "feat: Mobile Auth-Routen für API-Token"
```

---

### Task 5: `GET /api/mobile/v1/me` und `GET /api/mobile/v1/dashboard`

**Files:**
- Create: `src/app/api/mobile/v1/me/route.ts`
- Create: `src/app/api/mobile/v1/dashboard/route.ts`

- [ ] **Step 1: Me-Route implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(session.user);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 2: Dashboard-Route implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";
import { NOT_DELETED } from "@/lib/services/shared";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const [games, sessions, groups, events] = await Promise.all([
      prisma.game.count({ where: { ownerId: userId, ...NOT_DELETED } }),
      prisma.gameSession.count({ where: { createdById: userId, ...NOT_DELETED } }),
      prisma.group.count({
        where: {
          ...NOT_DELETED,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      }),
      prisma.event.count({
        where: {
          ...NOT_DELETED,
          OR: [{ createdById: userId }, { invites: { some: { userId } } }],
        },
      }),
    ]);

    return NextResponse.json({ games, sessions, groups, events });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 3: Tests schreiben und ausführen**

`tests/unit/api/mobile/v1/dashboard.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as DashboardGET } from "@/app/api/mobile/v1/dashboard/route";
import prisma from "@/lib/db";
import { createMockRequest, parseResponse } from "../../../../helpers";

vi.mock("@/lib/db", () => ({
  default: {
    game: { count: vi.fn() },
    gameSession: { count: vi.fn() },
    group: { count: vi.fn() },
    event: { count: vi.fn() },
  },
}));

describe("GET /api/mobile/v1/dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without auth", async () => {
    const req = createMockRequest("GET", "http://localhost:3000/api/mobile/v1/dashboard");
    const res = await (DashboardGET as Function)(req);
    expect(parseResponse(res).status).toBe(401);
  });
});
```

```bash
npm run test -- tests/unit/api/mobile/v1/dashboard.test.ts
npm run test -- tests/unit/api/mobile/v1/me.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mobile/v1/me src/app/api/mobile/v1/dashboard tests/unit/api/mobile/v1
git commit -m "feat: Mobile Me- und Dashboard-Routen"
```

---

### Task 6: `GET /api/mobile/v1/sync`

**Files:**
- Create: `src/app/api/mobile/v1/sync/route.ts`
- Create: `src/lib/sync-response.ts`
- Test: `tests/unit/api/mobile/v1/sync.test.ts`

- [ ] **Step 1: `src/lib/sync-response.ts` implementieren**

```typescript
import prisma from "@/lib/db";
import { NOT_DELETED } from "@/lib/services/shared";

export interface SyncChanges<T> {
  created: T[];
  updated: T[];
  deleted: string[];
}

export interface SyncPayload {
  syncedAt: string;
  games: SyncChanges<unknown>;
  sessions: SyncChanges<unknown>;
  events: SyncChanges<unknown>;
  groups: SyncChanges<unknown>;
  groupPolls: SyncChanges<unknown>;
  eventProposals: SyncChanges<unknown>;
  votes: SyncChanges<unknown>;
  dateVotes: SyncChanges<unknown>;
}

function sinceFilter(since?: Date) {
  return since ? { updatedAt: { gt: since } } : {};
}

function empty(): SyncChanges<unknown> {
  return { created: [], updated: [], deleted: [] };
}

export async function buildSyncPayload(userId: string, since?: Date): Promise<SyncPayload> {
  const updatedAfter = sinceFilter(since);

  const gamesCreated = await prisma.game.findMany({
    where: { ownerId: userId, ...NOT_DELETED, createdAt: updatedAfter.updatedAt ? { gt: since } : undefined },
  });
  const gamesUpdated = await prisma.game.findMany({
    where: { ownerId: userId, ...NOT_DELETED, updatedAt: updatedAfter.updatedAt },
  });

  const sessionsUpdated = await prisma.gameSession.findMany({
    where: { createdById: userId, ...NOT_DELETED, updatedAt: updatedAfter.updatedAt },
    include: { players: true, game: true },
  });

  return {
    syncedAt: new Date().toISOString(),
    games: { created: gamesCreated, updated: gamesUpdated, deleted: [] },
    sessions: { created: [], updated: sessionsUpdated, deleted: [] },
    events: empty(),
    groups: empty(),
    groupPolls: empty(),
    eventProposals: empty(),
    votes: empty(),
    dateVotes: empty(),
  };
}
```

> **Hinweis:** Das ist die MVP-Version. Events, Groups und deren Subentitäten werden analog mit denselben `created/updated/deleted`-Blöcken ergänzt (siehe DTO-Definition in der Design-Spec).

- [ ] **Step 2: Sync-Route implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { buildSyncPayload } from "@/lib/sync-response";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : undefined;

    const payload = await buildSyncPayload(session.user.id, since);
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 3: Test + Commit**

```bash
npm run test -- tests/unit/api/mobile/v1/sync.test.ts
npm run typecheck
git add src/app/api/mobile/v1/sync src/lib/sync-response.ts tests/unit/api/mobile/v1/sync.test.ts
git commit -m "feat: Sync-Endpoint für mobile Offline-Synchronisation"
```

### Task 7: Mobile Game-Routen (`/api/mobile/v1/games`)

**Files:**
- Create: `src/app/api/mobile/v1/games/route.ts`
- Create: `src/app/api/mobile/v1/games/[id]/route.ts`
- Create: `src/app/api/mobile/v1/games/[id]/sessions/route.ts`
- Test: `tests/unit/api/mobile/v1/games.test.ts`

- [ ] **Step 1: `src/app/api/mobile/v1/games/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GameService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const result = await GameService.list(session.user.id, { page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const game = await GameService.create(session.user.id, body);
    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 2: `src/app/api/mobile/v1/games/[id]/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GameService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const game = await GameService.getById(session.user.id, id);
    return NextResponse.json(game);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const game = await GameService.update(session.user.id, id, body);
    return NextResponse.json(game);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await GameService.delete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 3: `src/app/api/mobile/v1/games/[id]/sessions/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";
import { NOT_DELETED } from "@/lib/services/shared";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const sessions = await prisma.gameSession.findMany({
      where: { createdById: session.user.id, gameId: id, ...NOT_DELETED },
      orderBy: { playedAt: "desc" },
      take: 20,
      include: { players: true },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 4: Tests und Commit**

```bash
npm run test -- tests/unit/api/mobile/v1/games.test.ts
npm run typecheck
git add src/app/api/mobile/v1/games tests/unit/api/mobile/v1/games.test.ts
git commit -m "feat: Mobile Game-Routen"
```

---

### Task 8: Mobile Session-Routen (`/api/mobile/v1/sessions`)

**Files:**
- Create: `src/app/api/mobile/v1/sessions/route.ts`
- Create: `src/app/api/mobile/v1/sessions/[id]/route.ts`
- Test: `tests/unit/api/mobile/v1/sessions.test.ts`

- [ ] **Step 1: `src/app/api/mobile/v1/sessions/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { SessionService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const result = await SessionService.list(session.user.id, { page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const newSession = await SessionService.create(session.user.id, body);
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 2: `src/app/api/mobile/v1/sessions/[id]/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { SessionService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const data = await SessionService.getById(session.user.id, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const data = await SessionService.update(session.user.id, id, body);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await SessionService.delete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 3: Tests und Commit**

```bash
npm run test -- tests/unit/api/mobile/v1/sessions.test.ts
npm run typecheck
git add src/app/api/mobile/v1/sessions tests/unit/api/mobile/v1/sessions.test.ts
git commit -m "feat: Mobile Session-Routen"
```

---

### Task 9: Mobile Event-Routen inkl. Voting

**Files:**
- Create: `src/app/api/mobile/v1/events/route.ts`
- Create: `src/app/api/mobile/v1/events/[id]/route.ts`
- Create: `src/app/api/mobile/v1/events/[id]/votes/route.ts`
- Create: `src/app/api/mobile/v1/events/[id]/date-votes/route.ts`
- Create: `src/lib/services/vote.service.ts`
- Test: `tests/unit/api/mobile/v1/events.test.ts`

- [ ] **Step 1: `src/lib/services/vote.service.ts` aus Web-Routen extrahieren**

Die Logik aus `src/app/api/events/[id]/votes/route.ts` und `src/app/api/events/[id]/date-votes/route.ts` in einen Service verschieben. Signatur:

```typescript
export interface VoteInput { proposalId: string; }
export interface DateVoteInput { dateProposalId: string; }

export const VoteService = {
  async vote(userId: string, eventId: string, input: VoteInput) { /* ... */ },
  async voteDate(userId: string, eventId: string, input: DateVoteInput) { /* ... */ },
};
```

Verwende dabei `prisma`, `ApiError` und `SAFE_USER_SELECT`. Aktualisiere die bestehenden Web-Routen, sodass sie `VoteService` verwenden, ohne ihre Response-Formate zu ändern.

- [ ] **Step 2: `src/app/api/mobile/v1/events/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { EventService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const result = await EventService.list(session.user.id, { page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const event = await EventService.create(session.user.id, body);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 3: `src/app/api/mobile/v1/events/[id]/route.ts` implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { EventService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const event = await EventService.getById(session.user.id, id);
    return NextResponse.json(event);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const event = await EventService.update(session.user.id, id, body);
    return NextResponse.json(event);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await EventService.delete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 4: Voting-Routen implementieren**

`src/app/api/mobile/v1/events/[id]/votes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { VoteService } from "@/lib/services/vote.service";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const vote = await VoteService.vote(session.user.id, id, body);
    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
```

`src/app/api/mobile/v1/events/[id]/date-votes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { VoteService } from "@/lib/services/vote.service";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const vote = await VoteService.voteDate(session.user.id, id, body);
    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 5: Tests und Commit**

```bash
npm run test -- tests/unit/api/mobile/v1/events.test.ts
npm run test -- tests/unit/lib/vote.service.test.ts
npm run typecheck
git add src/app/api/mobile/v1/events src/lib/services/vote.service.ts tests/unit
git commit -m "feat: Mobile Event-Routen und Vote-Service"
```

---

### Task 10: Mobile Group-Routen

**Files:**
- Create: `src/app/api/mobile/v1/groups/route.ts`
- Create: `src/app/api/mobile/v1/groups/[id]/route.ts`
- Create: `src/app/api/mobile/v1/groups/[id]/join/route.ts`
- Test: `tests/unit/api/mobile/v1/groups.test.ts`

- [ ] **Step 1: CRUD-Routen implementieren**

`src/app/api/mobile/v1/groups/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GroupService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const result = await GroupService.list(session.user.id, { page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const group = await GroupService.create(session.user.id, body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
```

`src/app/api/mobile/v1/groups/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GroupService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const group = await GroupService.getById(session.user.id, id);
    return NextResponse.json(group);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const group = await GroupService.update(session.user.id, id, body);
    return NextResponse.json(group);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await GroupService.delete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
```

`src/app/api/mobile/v1/groups/[id]/join/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GroupService } from "@/lib/services";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await GroupService.joinByToken(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
```

> **Hinweis:** Falls `GroupService.joinByToken` nicht existiert, implementiere sie entsprechend der Web-Routine `src/app/api/groups/[id]/join/route.ts` als `GroupService.join` mit `groupId`.

- [ ] **Step 2: Tests und Commit**

```bash
npm run test -- tests/unit/api/mobile/v1/groups.test.ts
npm run typecheck
git add src/app/api/mobile/v1/groups tests/unit/api/mobile/v1/groups.test.ts
git commit -m "feat: Mobile Group-Routen"
```

---

### Task 11: Öffentliche Share-Links, Upload und Push-Device

**Files:**
- Create: `src/app/api/mobile/v1/public/event/[token]/route.ts`
- Create: `src/app/api/mobile/v1/public/invite/[token]/respond/route.ts`
- Create: `src/app/api/mobile/v1/uploads/route.ts`
- Create: `src/app/api/mobile/v1/devices/route.ts`

- [ ] **Step 1: Public Event-Route implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { findPublicEventByToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const event = await findPublicEventByToken(token);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (error) {
    return handleApiError(error);
  }
});
```

> **Hinweis:** Verwende die existierende `findPublicEventByToken`-Funktion aus `src/lib/event-share.ts`. Falls sie andere Rückgabetypen hat, typisiere die Route passend.

- [ ] **Step 2: Upload-Route implementieren**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { uploadImage } from "@/lib/storage";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Datei fehlt" }, { status: 400 });
    const url = await uploadImage(file, session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
});
```

> **Hinweis:** `uploadImage` muss aus einem bestehenden Image-Upload-Service importiert werden (z.B. `src/lib/storage.ts` oder `src/lib/upload.ts`). Ist keiner vorhanden, muss dieser zunächst implementiert werden.

- [ ] **Step 3: Push-Device-Registrierung**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { deviceToken, appVersion, locale } = await request.json();
    if (!deviceToken) return NextResponse.json({ error: "deviceToken fehlt" }, { status: 400 });
    await prisma.pushDevice.upsert({
      where: { userId_deviceToken: { userId: session.user.id, deviceToken } },
      create: { userId: session.user.id, deviceToken, appVersion, locale },
      update: { appVersion, locale, updatedAt: new Date() },
    });
    return NextResponse.json({ message: "Gerät registriert" });
  } catch (error) {
    return handleApiError(error);
  }
});
```

- [ ] **Step 4: Tests und Commit**

```bash
npm run test -- tests/unit/api/mobile/v1/public.test.ts
npm run test -- tests/unit/api/mobile/v1/uploads.test.ts
npm run test -- tests/unit/api/mobile/v1/devices.test.ts
npm run typecheck
git add src/app/api/mobile/v1/public src/app/api/mobile/v1/uploads src/app/api/mobile/v1/devices
git commit -m "feat: Mobile Public-Links, Upload und Push-Device Routen"
```

---

### Task 12: Sign in with Apple (optional, erfordert Apple Developer Account)

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/app/api/mobile/v1/auth/apple/route.ts`

- [ ] **Step 1: Apple-Provider in `src/lib/auth.ts` ergänzen**

```typescript
import Apple from "next-auth/providers/apple";

Apple({
  clientId: process.env.APPLE_CLIENT_ID!,
  clientSecret: {
    teamId: process.env.APPLE_TEAM_ID!,
    privateKey: process.env.APPLE_PRIVATE_KEY!,
    keyId: process.env.APPLE_KEY_ID!,
  },
}),
```

- [ ] **Step 2: Mobile Apple-Callback implementieren**

Verifiziere `identityToken` mit Apples Public Keys (z.B. über `jose`) oder verwende `next-auth` intern. Gib ein API-Token-Paar aus `createTokenPair` zurück.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import prisma from "@/lib/db";
import { createTokenPair } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError } from "@/lib/require-auth";

const APPLE_KEYS_URL = new URL("https://appleid.apple.com/auth/keys");

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { identityToken, authorizationCode, user: appleUser } = await request.json();
    if (!identityToken) return NextResponse.json({ error: "identityToken fehlt" }, { status: 400 });

    const { payload } = await jwtVerify(identityToken, createRemoteJWKSet(APPLE_KEYS_URL), {
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_CLIENT_ID!,
    });

    const email = (payload.email as string) || appleUser?.email;
    const sub = payload.sub as string;
    if (!sub) return NextResponse.json({ error: "Ungültiges Apple-Token" }, { status: 400 });

    let user = await prisma.user.findFirst({ where: { OR: [{ email }, { appleSub: sub }] } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || `${sub}@apple.id`,
          name: appleUser?.name?.firstName + (appleUser?.name?.lastName ? ` ${appleUser.name.lastName}` : "") || "Apple User",
          passwordHash: "",
          appleSub: sub,
          isActive: true,
        },
      });
    }

    const tokens = await createTokenPair(user.id, "Sign in with Apple");
    return NextResponse.json({ ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return handleApiError(error);
  }
});
```

> **Hinweis:** Ein Feld `appleSub` muss im `User`-Modell ergänzt werden (`appleSub String? @unique`).

- [ ] **Step 3: Commit**

```bash
npx prisma migrate dev --name add_apple_sub
git add prisma/schema.prisma prisma/migrations src/lib/auth.ts src/app/api/mobile/v1/auth/apple/route.ts
git commit -m "feat: Sign in with Apple für mobile Auth"
```

---

### Task 13: Dokumentation, OpenAPI und finale Verifikation

**Files:**
- Modify: `docs/openapi.yaml`
- Modify: `docs/FEATURES.md`
- Modify: `src/lib/changelog.ts`

- [ ] **Step 1: `docs/openapi.yaml` um `/api/mobile/v1/*` erweitern**

Füge für jeden neuen Endpunkt `paths` und `components.schemas` hinzu:

```yaml
paths:
  /api/mobile/v1/auth/login:
    post:
      tags: [Mobile Auth]
      summary: Mobile Login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string }
                password: { type: string }
      responses:
        "200":
          description: Access- und Refresh-Token
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken: { type: string }
                  refreshToken: { type: string }
                  expiresAt: { type: string, format: date-time }
                  user:
                    $ref: "#/components/schemas/User"
```

Wiederhole dies für `/api/mobile/v1/sync`, `/api/mobile/v1/games`, `/api/mobile/v1/sessions`, `/api/mobile/v1/events`, `/api/mobile/v1/groups`, `/api/mobile/v1/public/event/{token}`, `/api/mobile/v1/uploads`, `/api/mobile/v1/devices`.

- [ ] **Step 2: `docs/FEATURES.md` um Mobile-API-Abschnitt ergänzen**

Füge einen Abschnitt hinzu, der beschreibt, dass BoardGameTools nun eine versionierte mobile REST-API für die iOS-App bereitstellt und welche Domains sie abdeckt.

- [ ] **Step 3: Changelog-Eintrag schreiben**

Füge in `src/lib/changelog.ts` ein neues `feature`-Release ein (z.B. `0.48.0`) mit:

- Mobile Auth mit API-Token (Access/Refresh)
- `/api/mobile/v1/sync` für Offline-Synchronisation
- CRUD-Endpunkte für Spiele, Sessions, Events, Gruppen
- Public Share-Link, Upload und Push-Device Endpoints

- [ ] **Step 4: Finale Verifikation**

```bash
npm run test
npm run typecheck
npm run build
npm run security-check
npm run review-evaluate:regression
```

Behebe alle Regressions und füge ggf. weitere Tests hinzu.

- [ ] **Step 5: Commit**

```bash
git add docs/openapi.yaml docs/FEATURES.md src/lib/changelog.ts
git commit -m "docs: OpenAPI und Feature-Doku für Mobile API"
```

---

## Rollout / nächste Schritte

1. Das Backend kann unabhängig vom iOS-Client deployed und via `curl` / Postman getestet werden.
2. Nachdem der iOS-Client vorhanden ist, sollte ein Integrationstest mit echten Geräten (Push, Deep Links, Barcode) folgen.
3. Bevor Sign in with Apple in Produktion geht, müssen `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` und `APPLE_PRIVATE_KEY` in Vercel hinterlegt werden.

<!-- TASKS_END -->

