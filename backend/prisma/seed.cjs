// CommonJS seed script to run without compiling the whole TypeScript project
require('dotenv').config();
// Use the installed @prisma/client runtime build and the Postgres adapter so we can run this script
// without compiling the TypeScript project. The generated client expects an adapter option.
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.notification.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Alice Owner',
      email: 'alice@example.com',
      passwordHash: 'fakehash',
      role: 'OWNER',
    },
  });

  const client = await prisma.client.create({
    data: {
      name: 'Acme Corp',
      email: 'billing@acme.com',
      company: 'Acme',
      userId: user.id,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      clientId: client.id,
      status: 'SENT',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      total: 1000,
      items: {
        create: [
          { description: 'Design work', quantity: 2, unitPrice: 250 },
          { description: 'Development', quantity: 1, unitPrice: 500 },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.payment.create({
    data: { invoiceId: invoice.id, amount: 200 },
  });

  await prisma.reminder.create({
    data: { invoiceId: invoice.id, sendAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
  });

  await prisma.notification.create({
    data: { userId: user.id, message: 'Welcome to CashGuard! Your account is ready.' },
  });

  console.log('Seeding finished (JS).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
