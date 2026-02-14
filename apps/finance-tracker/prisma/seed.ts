import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.completedCycle.deleteMany();
  await prisma.item.deleteMany();
  await prisma.workspaceUser.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      username: 'demo',
      displayName: 'Demo User',
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      balance: 5000,
      cycleStartDay: 10,
      cycleEndDay: 16,
    },
  });

  await prisma.workspaceUser.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      permission: 'OWNER',
    },
  });

  await prisma.item.createMany({
    data: [
      {
        workspaceId: workspace.id,
        type: 'INCOME',
        label: 'Monthly Salary',
        amount: 8000,
        dayOfMonth: 10,
      },
      {
        workspaceId: workspace.id,
        type: 'RENT',
        label: 'Apartment Rent',
        amount: 3000,
        dayOfMonth: 1,
      },
      {
        workspaceId: workspace.id,
        type: 'CREDIT_CARD',
        label: 'Credit Card',
        amount: 2000,
        dayOfMonth: 15,
      },
    ],
  });

  console.log(`Seeded user: ${user.username}, workspace: ${workspace.id}, 3 items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
