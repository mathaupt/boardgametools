import { normalizeGameText } from "../../src/lib/game-text";
import path from "node:path";

export interface GameCleanupRow {
  id: string;
  updatedAt: Date;
  name: string;
  description: string | null;
}

export interface ProposalCleanupRow {
  id: string;
  eventId: string;
  bggName: string | null;
}

export type GameCleanupChange = NonNullable<ReturnType<typeof planGameCleanup>> & { appliedAt?: string; rolledBack?: boolean };
export type ProposalCleanupChange = NonNullable<ReturnType<typeof planProposalCleanup>> & { applied?: boolean; rolledBack?: boolean };

interface GameWriteClient {
  game: { updateMany(args: {
    where: { id: string; updatedAt: Date; name: string; description: string | null };
    data: { name: string; description: string | null; updatedAt: Date };
  }): Promise<{ count: number }> };
}

interface ProposalWriteClient {
  gameProposal: { updateMany(args: {
    where: { id: string; eventId: string; bggName: string | null };
    data: { bggName: string | null };
  }): Promise<{ count: number }> };
  event: { update(args: { where: { id: string }; data: { updatedAt: Date } }): Promise<unknown> };
}

type WriteResult = { conflicts: number; changed: number };

export async function applyGameChanges(client: GameWriteClient, changes: GameCleanupChange[], now = () => new Date()): Promise<WriteResult> {
  const result: WriteResult = { conflicts: 0, changed: 0 };
  for (const change of changes) {
    if (change.appliedAt) continue;
    const appliedAt = now();
    const update = await client.game.updateMany({
      where: { id: change.id, updatedAt: new Date(change.updatedAt), name: change.before.name, description: change.before.description },
      data: { name: change.after.name, description: change.after.description, updatedAt: appliedAt },
    });
    if (update.count !== 1) { result.conflicts += 1; continue; }
    change.appliedAt = appliedAt.toISOString();
    result.changed += 1;
  }
  return result;
}

export async function applyProposalChanges(client: ProposalWriteClient, changes: ProposalCleanupChange[], now = () => new Date()): Promise<WriteResult> {
  const result: WriteResult = { conflicts: 0, changed: 0 };
  for (const change of changes) {
    if (change.applied) continue;
    const update = await client.gameProposal.updateMany({
      where: { id: change.id, eventId: change.eventId, bggName: change.before },
      data: { bggName: change.after },
    });
    if (update.count !== 1) { result.conflicts += 1; continue; }
    await client.event.update({ where: { id: change.eventId }, data: { updatedAt: now() } });
    change.applied = true;
    result.changed += 1;
  }
  return result;
}

export async function rollbackGameChanges(client: GameWriteClient, changes: GameCleanupChange[], now = () => new Date()): Promise<WriteResult> {
  const result: WriteResult = { conflicts: 0, changed: 0 };
  for (const change of changes) {
    if (!change.appliedAt || change.rolledBack) continue;
    const update = await client.game.updateMany({
      where: { id: change.id, updatedAt: new Date(change.appliedAt), name: change.after.name, description: change.after.description },
      data: { name: change.before.name, description: change.before.description, updatedAt: now() },
    });
    if (update.count !== 1) { result.conflicts += 1; continue; }
    change.rolledBack = true;
    result.changed += 1;
  }
  return result;
}

export async function rollbackProposalChanges(client: ProposalWriteClient, changes: ProposalCleanupChange[], now = () => new Date()): Promise<WriteResult> {
  const result: WriteResult = { conflicts: 0, changed: 0 };
  for (const change of changes) {
    if (!change.applied || change.rolledBack) continue;
    const update = await client.gameProposal.updateMany({
      where: { id: change.id, eventId: change.eventId, bggName: change.after },
      data: { bggName: change.before },
    });
    if (update.count !== 1) { result.conflicts += 1; continue; }
    await client.event.update({ where: { id: change.eventId }, data: { updatedAt: now() } });
    change.rolledBack = true;
    result.changed += 1;
  }
  return result;
}

export function resolveMaintenanceConfig(input: { databaseUrl?: string; manifestPath?: string; cwd: string }) {
  if (!input.databaseUrl) throw new Error("BGT_MAINTENANCE_DATABASE_URL ist erforderlich; keine andere Datenbankvariable wird verwendet.");
  if (!input.manifestPath) throw new Error("Ein Manifestpfad ist erforderlich.");
  const root = path.resolve(input.cwd, ".maintenance");
  const manifestPath = path.resolve(input.cwd, input.manifestPath);
  if (!manifestPath.startsWith(`${root}${path.sep}`)) throw new Error("Das Manifest muss unter .maintenance/ liegen.");
  let databaseUrl: URL;
  try { databaseUrl = new URL(input.databaseUrl); }
  catch { throw new Error("BGT_MAINTENANCE_DATABASE_URL ist ungültig."); }
  return {
    connectionString: input.databaseUrl,
    manifestPath,
    databaseFingerprintInput: `${databaseUrl.protocol}//${databaseUrl.host}${databaseUrl.pathname}`,
  };
}

export function planGameCleanup(row: GameCleanupRow) {
  const name = normalizeGameText(row.name);
  const description = row.description == null ? null : normalizeGameText(row.description);
  if (name === row.name && description === row.description) return null;
  return {
    id: row.id,
    updatedAt: row.updatedAt.toISOString(),
    before: { name: row.name, description: row.description },
    after: { name, description },
  };
}

export function planProposalCleanup(row: ProposalCleanupRow) {
  if (row.bggName == null) return null;
  const bggName = normalizeGameText(row.bggName);
  if (bggName === row.bggName) return null;
  return {
    id: row.id,
    eventId: row.eventId,
    before: row.bggName,
    after: bggName,
  };
}
