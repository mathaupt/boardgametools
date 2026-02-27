const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "soulsaver83@gmail.com";
  const password = "@@M070183h";
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Test User",
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      name: "Test User",
      passwordHash,
      role: "USER",
      isActive: true,
    },
  });

  console.log(`Seeded user ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Error seeding test user", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
