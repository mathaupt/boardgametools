import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  config: undefined as Record<string, any> | undefined,
  findUnique: vi.fn(),
  compare: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: (config: Record<string, any>) => {
    state.config = config;
    return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: (config: Record<string, any>) => config,
}));
vi.mock("bcryptjs", () => ({ compare: state.compare }));
vi.mock("@/lib/db", () => ({ default: { user: { findUnique: state.findUnique } } }));

import "@/lib/auth";

describe("NextAuth configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function authorize() {
    const provider = state.config?.providers[0] as { authorize: (credentials?: unknown) => Promise<unknown> };
    return provider.authorize;
  }

  it("rejects missing credentials without querying the database", async () => {
    await expect(authorize()()).resolves.toBeNull();
    await expect(authorize()({ email: "user@example.com" })).resolves.toBeNull();
    expect(state.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown or inactive account", async () => {
    state.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ isActive: false });
    await expect(authorize()({ email: "user@example.com", password: "secret" })).resolves.toBeNull();
    await expect(authorize()({ email: "user@example.com", password: "secret" })).resolves.toBeNull();
    expect(state.compare).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password and returns only the authenticated identity", async () => {
    const account = {
      id: "user-1", email: "user@example.com", name: "Player", role: "USER",
      isActive: true, passwordHash: "stored-hash", privateField: "never-return",
    };
    state.findUnique.mockResolvedValue(account);
    state.compare.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await expect(authorize()({ email: account.email, password: "bad" })).resolves.toBeNull();
    await expect(authorize()({ email: account.email, password: "good" })).resolves.toEqual({
      id: account.id, email: account.email, name: account.name, role: account.role, isActive: true,
    });
    expect(state.compare).toHaveBeenCalledWith("good", "stored-hash");
  });

  it("projects the current database identity into the session and disables deleted users", async () => {
    const callbacks = state.config?.callbacks;
    const session = { user: { id: "old", name: "Old" } };
    state.findUnique.mockResolvedValue({
      id: "user-1", email: "user@example.com", name: "Player", role: "ADMIN", isActive: true,
      passwordHash: "not-selected",
    });

    await expect(callbacks.session({ session, token: { id: "user-1" } })).resolves.toMatchObject({
      user: { id: "user-1", email: "user@example.com", name: "Player", role: "ADMIN", isActive: true },
    });
    expect(state.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    state.findUnique.mockResolvedValue(null);
    await expect(callbacks.session({ session: { user: {} }, token: { id: "deleted-user" } }))
      .resolves.toMatchObject({ user: { isActive: false } });
  });

  it("copies user identifiers into the JWT only when authentication supplies a user", async () => {
    const jwt = state.config?.callbacks.jwt;
    await expect(jwt({ token: { sub: "subject" }, user: { id: "user-1", role: "ADMIN" } }))
      .resolves.toEqual({ sub: "subject", id: "user-1", role: "ADMIN" });
    await expect(jwt({ token: { sub: "subject" } })).resolves.toEqual({ sub: "subject" });
  });
});
