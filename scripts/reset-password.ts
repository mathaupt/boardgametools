import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const email = (await rl.question("E-Mail des Users: ")).trim();
    const newPassword = await rl.question("Neues Passwort: ");

    if (!email || !newPassword) {
      console.error("E-Mail und Passwort dürfen nicht leer sein.");
      process.exit(1);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`Nutzer ${email} nicht gefunden.`);
      process.exit(1);
    }

    const passwordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    console.log(`✓ Passwort für ${email} erfolgreich geändert.`);
  } finally {
    rl.close();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
