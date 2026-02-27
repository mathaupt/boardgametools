import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

async function main() {
  const games = await prisma.game.findMany({ select: { id: true, name: true, description: true } });

  let fixed = 0;

  for (const game of games) {
    const newName = decodeHtmlEntities(game.name);
    const newDesc = game.description ? decodeHtmlEntities(game.description) : null;

    if (newName !== game.name || newDesc !== game.description) {
      await prisma.game.update({
        where: { id: game.id },
        data: { name: newName, description: newDesc ?? undefined },
      });
      console.log(`  Korrigiert: "${game.name}" → "${newName}"`);
      fixed++;
    }
  }

  console.log(`\n✓ ${fixed} Spiel(e) korrigiert, ${games.length - fixed} bereits korrekt.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
