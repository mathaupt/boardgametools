import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), update: vi.fn(), hash: vi.fn(), compare: vi.fn(), handle: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.handle }));
vi.mock("@/lib/db", () => ({ default: { user: { findUnique: m.find, update: m.update } } }));
vi.mock("bcryptjs", () => ({ hash: m.hash, compare: m.compare }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/error-messages", () => ({ Errors: { USER_NOT_FOUND: "Benutzer nicht gefunden" } }));
import { GET, PUT } from "@/app/api/users/me/route";
const user = { id: "u1", name: "Alex", email: "alex@example.test", passwordHash: "secret-hash", role: "USER", createdAt: new Date(), updatedAt: new Date() };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "u1" }); m.find.mockResolvedValue(user); m.update.mockResolvedValue(user); m.hash.mockResolvedValue("new-hash"); m.compare.mockResolvedValue(true); m.handle.mockImplementation(() => Response.json({ error: "server" }, { status: 500 })); });
const req = (body: unknown) => new Request("http://local/api", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) as never;

describe("Eigenes Nutzerkonto", () => {
  it("liefert nur die sichere Kontoprojektion", async () => {
    const { passwordHash: _passwordHash, ...safeUser } = user; m.find.mockResolvedValueOnce(safeUser);
    const response = await GET({} as never, {} as never); expect(response.status).toBe(200); expect(await response.json()).not.toHaveProperty("passwordHash");
    expect(m.find).toHaveBeenCalledWith({ where: { id: "u1" }, select: expect.objectContaining({ email: true, role: true }) });
    m.find.mockResolvedValueOnce(null); expect((await GET({} as never, {} as never)).status).toBe(404);
  });
  it("validiert Eingaben und findet fehlende oder doppelte Konten", async () => {
    expect((await PUT(req({ email: "x".repeat(255) }), {} as never)).status).toBe(400);
    m.find.mockResolvedValueOnce(null); expect((await PUT(req({ name: "Neu" }), {} as never)).status).toBe(404);
    m.find.mockResolvedValueOnce(user).mockResolvedValueOnce({ id: "other" });
    expect((await PUT(req({ email: "taken@example.test" }), {} as never)).status).toBe(409);
  });
  it("fordert das bisherige Passwort an, prüft es und ändert sonst nur Kontofelder", async () => {
    expect((await PUT(req({ newPassword: "long-secret" }), {} as never)).status).toBe(400);
    m.compare.mockResolvedValueOnce(false); expect((await PUT(req({ currentPassword: "wrong", newPassword: "long-secret" }), {} as never)).status).toBe(403);
    await PUT(req({ name: "Alex neu", currentPassword: "old", newPassword: "long-secret" }), {} as never);
    expect(m.hash).toHaveBeenCalledWith("long-secret", 12);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "u1" }, data: { name: "Alex neu", passwordHash: "new-hash" }, select: expect.not.objectContaining({ passwordHash: true }) }));
  });
  it("erkennt unveränderte Felder und meldet unerwartete Schreibfehler über den Handler", async () => {
    expect(await (await PUT(req({ name: "Alex", email: "alex@example.test" }), {} as never)).json()).toEqual({ message: "Keine Änderungen" });
    m.update.mockRejectedValueOnce(new Error("db")); expect((await PUT(req({ name: "Other" }), {} as never)).status).toBe(500); expect(m.handle).toHaveBeenCalledOnce();
  });
});
