// Seed script - run with: node prisma/seed.js
// Or: npx tsx prisma/seed.js (if file is .ts)
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: "file:/Users/user/kawan-finance/prisma/dev.db",
});
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "Makan & Minum", type: "EXPENSE", icon: "🍽️", color: "#ef4444" },
  { name: "Transportasi", type: "EXPENSE", icon: "🚗", color: "#f59e0b" },
  { name: "Belanja", type: "EXPENSE", icon: "🛍️", color: "#ec4899" },
  { name: "Tagihan", type: "EXPENSE", icon: "📄", color: "#8b5cf6" },
  { name: "Hiburan", type: "EXPENSE", icon: "🎬", color: "#06b6d4" },
  { name: "Kesehatan", type: "EXPENSE", icon: "🏥", color: "#10b981" },
  { name: "Pendidikan", type: "EXPENSE", icon: "📚", color: "#6366f1" },
  { name: "Tempat Tinggal", type: "EXPENSE", icon: "🏠", color: "#f97316" },
  { name: "Internet & Pulsa", type: "EXPENSE", icon: "📡", color: "#14b8a6" },
  { name: "Asuransi", type: "EXPENSE", icon: "🛡️", color: "#a855f7" },
  { name: "Lainnya (Pengeluaran)", type: "EXPENSE", icon: "📌", color: "#6b7280" },
  { name: "Gaji", type: "INCOME", icon: "💰", color: "#22c55e" },
  { name: "Freelance", type: "INCOME", icon: "💼", color: "#16a34a" },
  { name: "Bisnis", type: "INCOME", icon: "🏪", color: "#15803d" },
  { name: "Investasi", type: "INCOME", icon: "📈", color: "#059669" },
  { name: "Lainnya (Pemasukan)", type: "INCOME", icon: "💵", color: "#65a30d" },
];

async function main() {
  const count = await prisma.category.count();
  if (count > 0) {
    console.log(`Already seeded: ${count} categories`);
    return;
  }
  for (const cat of defaultCategories) {
    await prisma.category.create({ data: cat });
  }
  console.log(`Seeded ${defaultCategories.length} categories`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
