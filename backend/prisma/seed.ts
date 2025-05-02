import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rolesSeeding() {
  const adminRole = await prisma.roles.upsert({
    where: { name: 'Admin' },
    update: {}, 
    create: {
      name: 'Admin',
    },
  });

  const userRole = await prisma.roles.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
    },
  });
}

async function executeSeedings() {
  await rolesSeeding();
}

executeSeedings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
