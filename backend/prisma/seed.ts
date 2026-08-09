import bcrypt from "bcryptjs";
import prisma from "../src/utils/prisma.js";

const users = [
  {
    name: "System Administrator",
    email: "admin@erp.com",
    password: "Admin@123",
    role: "ADMIN" as const,
  },
  {
    name: "Sales Manager",
    email: "sales@erp.com",
    password: "Sales@123",
    role: "SALES" as const,
  },
  {
    name: "Warehouse Manager",
    email: "warehouse@erp.com",
    password: "Warehouse@123",
    role: "WAREHOUSE" as const,
  },
  {
    name: "Accounts Manager",
    email: "accounts@erp.com",
    password: "Accounts@123",
    role: "ACCOUNTS" as const,
  },
];

const main = async () => {
  console.log("🌱 Seeding users...");

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        isActive: true,
      },
    });

    console.log(`✓ ${user.email}`);
  }

  console.log("✅ Users seeded successfully");
};

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });