import dotenv from 'dotenv';
dotenv.config({ override: true });

import { prisma } from '../src/prisma';
import { hashPassword } from '../src/auth';

async function main() {
  // Clear existing data (for idempotent seeding)
  await prisma.notification.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashPassword('Password123');

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@cashguard.test',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Owner User',
      email: 'owner@cashguard.test',
      passwordHash,
      role: 'OWNER',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@cashguard.test',
      passwordHash,
      role: 'STAFF',
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
    data: {
      invoiceId: invoice.id,
      amount: 200,
    },
  });

  await prisma.reminder.create({
    data: {
      invoiceId: invoice.id,
      sendAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      message: 'Seed data is ready for testing.',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
