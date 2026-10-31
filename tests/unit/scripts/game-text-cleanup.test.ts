import { describe, expect, it, vi } from "vitest";
import {
  applyGameChanges,
  applyProposalChanges,
  type GameCleanupChange,
  type ProposalCleanupChange,
  planGameCleanup,
  planProposalCleanup,
  resolveMaintenanceConfig,
  rollbackGameChanges,
  rollbackProposalChanges,
} from "../../../scripts/lib/game-text-cleanup";

describe("game text cleanup planning", () => {
  it("plans only changed fields and preserves timestamps for compare-and-set", () => {
    const updatedAt = new Date("2026-01-01T00:00:00Z");
    expect(planGameCleanup({ id: "g1", updatedAt, name: "Dungeons &amp;amp; Dragons", description: null })).toEqual({
      id: "g1",
      updatedAt: updatedAt.toISOString(),
      before: { name: "Dungeons &amp;amp; Dragons", description: null },
      after: { name: "Dungeons & Dragons", description: null },
    });
  });

  it("is idempotent and rejects names that exceed the supported encoding depth", () => {
    const row = { id: "g1", updatedAt: new Date(), name: "Dungeons & Dragons", description: null };
    expect(planGameCleanup(row)).toBeNull();
    const encoded = Array.from({ length: 8 }).reduce<string>((value) => value.replaceAll("&", "&amp;"), "&copy;");
    expect(() => planGameCleanup({ ...row, name: encoded })).toThrow(RangeError);
  });

  it("normalizes inline proposal names without changing proposal identity", () => {
    expect(planProposalCleanup({ id: "p1", eventId: "e1", bggName: "A &amp; B" })).toEqual({
      id: "p1", eventId: "e1", before: "A &amp; B", after: "A & B",
    });
    expect(planProposalCleanup({ id: "p2", eventId: "e1", bggName: null })).toBeNull();
  });

  it("requires an explicit maintenance URL and confines manifests to .maintenance", () => {
    expect(() => resolveMaintenanceConfig({ databaseUrl: undefined, manifestPath: ".maintenance/test.json", cwd: "/tmp/bgt" }))
      .toThrow("BGT_MAINTENANCE_DATABASE_URL ist erforderlich");
    expect(() => resolveMaintenanceConfig({ databaseUrl: "postgres://test.invalid/db", manifestPath: "outside.json", cwd: "/tmp/bgt" }))
      .toThrow("Das Manifest muss unter .maintenance/");
    expect(resolveMaintenanceConfig({ databaseUrl: "postgres://test.invalid/db", manifestPath: ".maintenance/test.json", cwd: "/tmp/bgt" }).manifestPath)
      .toBe("/tmp/bgt/.maintenance/test.json");
  });

  it("applies game changes only against the manifest's original values", async () => {
    const change: GameCleanupChange = planGameCleanup({ id: "g1", updatedAt: new Date("2026-01-01Z"), name: "A &amp; B", description: null })!;
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const appliedAt = new Date("2026-02-01Z");
    const result = await applyGameChanges({ game: { updateMany } }, [change], () => appliedAt);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "g1", updatedAt: new Date("2026-01-01Z"), name: "A &amp; B", description: null },
      data: { name: "A & B", description: null, updatedAt: appliedAt },
    });
    expect(change.appliedAt).toBe(appliedAt.toISOString());
    expect(result).toEqual({ conflicts: 0, changed: 1 });
  });

  it("reports compare conflicts without marking rows applied", async () => {
    const change: GameCleanupChange = planGameCleanup({ id: "g1", updatedAt: new Date("2026-01-01Z"), name: "A &amp; B", description: null })!;
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const result = await applyGameChanges({ game: { updateMany } }, [change], () => new Date());
    expect(change.appliedAt).toBeUndefined();
    expect(result).toEqual({ conflicts: 1, changed: 0 });
  });

  it("rolls back a game only if it still matches the applied manifest", async () => {
    const change: GameCleanupChange = { ...planGameCleanup({ id: "g1", updatedAt: new Date("2026-01-01Z"), name: "A &amp; B", description: null })!, appliedAt: "2026-02-01T00:00:00.000Z" };
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const result = await rollbackGameChanges({ game: { updateMany } }, [change], () => new Date("2026-03-01Z"));
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "g1", updatedAt: new Date(change.appliedAt!), name: "A & B", description: null },
      data: { name: "A &amp; B", description: null, updatedAt: new Date("2026-03-01Z") },
    }));
    expect(change.rolledBack).toBe(true);
    expect(result).toEqual({ conflicts: 0, changed: 1 });
  });

  it("updates an event timestamp in the same maintenance transaction for inline proposals", async () => {
    const change: ProposalCleanupChange = { ...planProposalCleanup({ id: "p1", eventId: "e1", bggName: "A &amp; B" })! };
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const updateEvent = vi.fn().mockResolvedValue({});
    const result = await applyProposalChanges({ gameProposal: { updateMany }, event: { update: updateEvent } }, [change], () => new Date("2026-02-01Z"));
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "p1", eventId: "e1", bggName: "A &amp; B" }, data: { bggName: "A & B" } });
    expect(updateEvent).toHaveBeenCalledWith({ where: { id: "e1" }, data: { updatedAt: new Date("2026-02-01Z") } });
    expect(change.applied).toBe(true);
    expect(result).toEqual({ conflicts: 0, changed: 1 });
  });

  it("rolls back proposals only when their applied value still matches", async () => {
    const change: ProposalCleanupChange = { ...planProposalCleanup({ id: "p1", eventId: "e1", bggName: "A &amp; B" })!, applied: true };
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const updateEvent = vi.fn().mockResolvedValue({});
    const result = await rollbackProposalChanges({ gameProposal: { updateMany }, event: { update: updateEvent } }, [change], () => new Date("2026-03-01Z"));
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "p1", eventId: "e1", bggName: "A & B" }, data: { bggName: "A &amp; B" } });
    expect(change.rolledBack).toBe(true);
    expect(result).toEqual({ conflicts: 0, changed: 1 });
  });
});
