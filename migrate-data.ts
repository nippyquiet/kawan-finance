const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");

// Read from SQLite
const db = new Database("./dev.db");
const cats = db.prepare("SELECT * FROM Category").all();
const txns = db.prepare("SELECT * FROM Transaction").all();
const debts = db.prepare("SELECT * FROM Debt").all();
const invs = db.prepare("SELECT * FROM Investment").all();
const budgets = db.prepare("SELECT * FROM Budget").all();
db.close();

console.log(`Found: ${cats.length} categories, ${txns.length} transactions, ${debts.length} debts, ${invs.length} investments, ${budgets.length} budgets`);

// Write to PostgreSQL
const pg = new PrismaClient();

async function main() {
  for (const cat of cats) {
    await pg.category.create({ data: cat });
  }
  console.log(`✓ ${cats.length} categories`);

  for (const t of txns) {
    await pg.transaction.create({ data: t });
  }
  console.log(`✓ ${txns.length} transactions`);

  for (const d of debts) {
    await pg.debt.create({ data: d });
  }
  console.log(`✓ ${debts.length} debts`);

  for (const inv of invs) {
    await pg.investment.create({ data: inv });
  }
  console.log(`✓ ${invs.length} investments`);

  for (const b of budgets) {
    await pg.budget.create({ data: b });
  }
  console.log(`✓ ${budgets.length} budgets`);

  await pg.$disconnect();
  console.log("✅ Migration complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });
