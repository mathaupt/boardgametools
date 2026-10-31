import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  applyGameChanges,
  applyProposalChanges,
  planGameCleanup,
  planProposalCleanup,
  resolveMaintenanceConfig,
  rollbackGameChanges,
  rollbackProposalChanges,
} from "./lib/game-text-cleanup";

type GameChange = NonNullable<ReturnType<typeof planGameCleanup>> & { appliedAt?: string; rolledBack?: boolean };
type ProposalChange = NonNullable<ReturnType<typeof planProposalCleanup>> & { applied?: boolean; rolledBack?: boolean };
interface Manifest {
  version: 1;
  databaseFingerprint: string;
  generatedAt: string;
  status: "dry-run" | "partially-applied" | "applied" | "rolled-back";
  rejectedDeep: number;
  rejectedRows: Array<{ entity: "Game" | "GameProposal"; id: string }>;
  games: GameChange[];
  proposals: ProposalChange[];
}

const PAGE_SIZE = 200;
const args = process.argv.slice(2);
const mode = args.includes("--apply") ? "apply" : args.includes("--rollback") ? "rollback" : "dry-run";
const manifestOption = args.includes("--manifest") ? args[args.indexOf("--manifest") + 1] : undefined;
const reportOption = args.includes("--report") ? args[args.indexOf("--report") + 1] : undefined;
const manifestPath = manifestOption ?? reportOption;
const connectionString = process.env.BGT_MAINTENANCE_DATABASE_URL;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

let config: ReturnType<typeof resolveMaintenanceConfig>;
try {
  config = resolveMaintenanceConfig({ databaseUrl: connectionString, manifestPath, cwd: process.cwd() });
} catch {
  fail("Wartungskonfiguration ungültig: setze BGT_MAINTENANCE_DATABASE_URL und einen Manifestpfad unter .maintenance/.");
}
const absoluteManifestPath = config.manifestPath;
const databaseFingerprint = createHash("sha256").update(config.databaseFingerprintInput).digest("hex");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.connectionString }) });

async function writeManifest(manifest: Manifest): Promise<void> {
  await mkdir(path.dirname(absoluteManifestPath), { recursive: true, mode: 0o700 });
  await writeFile(absoluteManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await chmod(absoluteManifestPath, 0o600);
}

async function readManifest(): Promise<Manifest> {
  const value = JSON.parse(await readFile(absoluteManifestPath, "utf8")) as Manifest;
  if (value.version !== 1 || value.databaseFingerprint !== databaseFingerprint) {
    fail("Manifestversion oder Datenbankfingerprint stimmen nicht überein.");
  }
  return value;
}

async function scan(): Promise<Manifest> {
  const games: GameChange[] = [];
  let rejectedDeep = 0;
  const rejectedRows: Manifest["rejectedRows"] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await prisma.game.findMany({
      where: cursor ? { id: { gt: cursor } } : {},
      orderBy: { id: "asc" }, take: PAGE_SIZE,
      select: { id: true, updatedAt: true, name: true, description: true },
    });
    if (page.length === 0) break;
    for (const row of page) {
      try { const change = planGameCleanup(row); if (change) games.push(change); }
      catch { rejectedDeep += 1; rejectedRows.push({ entity: "Game", id: row.id }); }
    }
    cursor = page[page.length - 1].id;
    if (page.length < PAGE_SIZE) break;
  }

  const proposals: ProposalChange[] = [];
  cursor = undefined;
  for (;;) {
    const proposalPage: Array<{ id: string; eventId: string; bggName: string | null }> = await prisma.gameProposal.findMany({
      where: cursor ? { id: { gt: cursor }, bggName: { not: null } } : { bggName: { not: null } },
      orderBy: { id: "asc" }, take: PAGE_SIZE,
      select: { id: true, eventId: true, bggName: true },
    });
    if (proposalPage.length === 0) break;
    for (const row of proposalPage) {
      try { const change = planProposalCleanup(row); if (change) proposals.push(change); }
      catch { rejectedDeep += 1; rejectedRows.push({ entity: "GameProposal", id: row.id }); }
    }
    cursor = proposalPage[proposalPage.length - 1].id;
    if (proposalPage.length < PAGE_SIZE) break;
  }

  return { version: 1, databaseFingerprint, generatedAt: new Date().toISOString(), status: "dry-run", rejectedDeep, rejectedRows, games, proposals };
}

async function apply(manifest: Manifest): Promise<{ conflicts: number; changed: number }> {
  const result = { conflicts: 0, changed: 0 };
  for (let offset = 0; offset < manifest.games.length; offset += PAGE_SIZE) {
    const page = manifest.games.slice(offset, offset + PAGE_SIZE);
    const pageResult = await prisma.$transaction((tx) => applyGameChanges(tx, page));
    result.conflicts += pageResult.conflicts;
    result.changed += pageResult.changed;
  }
  for (let offset = 0; offset < manifest.proposals.length; offset += PAGE_SIZE) {
    const page = manifest.proposals.slice(offset, offset + PAGE_SIZE);
    const pageResult = await prisma.$transaction((tx) => applyProposalChanges(tx, page));
    result.conflicts += pageResult.conflicts;
    result.changed += pageResult.changed;
  }
  return result;
}

async function rollback(manifest: Manifest): Promise<number> {
  let conflicts = 0;
  for (let offset = 0; offset < manifest.games.length; offset += PAGE_SIZE) {
    const pageResult = await prisma.$transaction((tx) => rollbackGameChanges(tx, manifest.games.slice(offset, offset + PAGE_SIZE)));
    conflicts += pageResult.conflicts;
  }
  for (let offset = 0; offset < manifest.proposals.length; offset += PAGE_SIZE) {
    const pageResult = await prisma.$transaction((tx) => rollbackProposalChanges(tx, manifest.proposals.slice(offset, offset + PAGE_SIZE)));
    conflicts += pageResult.conflicts;
  }
  return conflicts;
}

async function main() {
  if (mode === "dry-run") {
    const manifest = await scan();
    await writeManifest(manifest);
    console.log(`Dry-Run abgeschlossen: ${manifest.games.length} Spiele, ${manifest.proposals.length} Vorschläge, ${manifest.rejectedDeep} Werte mit zu tiefer Kodierung; 0 Änderungen. Manifest: ${path.relative(process.cwd(), absoluteManifestPath)}`);
    return;
  }

  const manifest = await readManifest();
  if (mode === "apply") {
    if (manifest.status !== "dry-run" && manifest.status !== "partially-applied") fail("Apply benötigt ein Dry-Run- oder teilweise angewendetes Manifest.");
    const result = await apply(manifest);
    manifest.status = result.conflicts ? "partially-applied" : "applied";
    await writeManifest(manifest);
    console.log(`Apply abgeschlossen: ${result.changed} geändert, ${result.conflicts} Konflikte.`);
    if (result.conflicts) process.exitCode = 1;
  } else {
    if (manifest.status !== "applied" && manifest.status !== "partially-applied") fail("Rollback benötigt ein angewendetes Manifest.");
    const conflicts = await rollback(manifest);
    if (conflicts === 0) manifest.status = "rolled-back";
    await writeManifest(manifest);
    console.log(`Rollback abgeschlossen: ${manifest.games.length + manifest.proposals.length - conflicts} zurückgesetzt, ${conflicts} Konflikte.`);
    if (conflicts) process.exitCode = 1;
  }
}

main().catch(() => fail("Wartungslauf fehlgeschlagen; Details wurden aus Datenschutzgründen nicht ausgegeben."))
  .finally(async () => prisma.$disconnect());
