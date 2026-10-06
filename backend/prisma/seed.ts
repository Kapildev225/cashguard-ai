// The Prisma client for this project is generated to ../src/generated/prisma
// (see prisma/schema.prisma generator output). Import directly from the
// generated client so the seed script doesn't rely on the default
// node_modules location.
// Ensure environment variables are loaded (so DIRECT_URL is available)
import "dotenv/config";
// Import the generated Prisma client entry file directly.
import {PrismaClient, Role} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
// Create the adapter using the DIRECT_URL from env (matches src/config/prisma.ts)
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });
async function main(){
    const password = await bcrypt.hash("admin123", 10);
    const users =[
    { name: "Admin User",
        email: "admin@example.com",
        // password: password,
        role: Role.ADMIN
    },
    {
        name: "Owner User",
        email: "owner@example.com",
        role : Role.OWNER

    },
    {
        name: "Regular User",
        email: "user@example.com",
        role: Role.USER
    }
    ];


  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash: password,
        role: u.role,
      },
    });
  }
  console.log("Seeding completed.");
  console.log("admin@example.com/owner@example.com/user@example.com")
 console.log("Password for all users: admin123")
}

main()
 .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });   
