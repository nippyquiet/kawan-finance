import sqlite3
import json
import psycopg2
from datetime import datetime

# Source data
src = sqlite3.connect("/Users/user/kawan-finance/prisma/dev.db")
src.row_factory = sqlite3.Row

tables = ["Category", "Transaction", "Debt", "Investment", "Budget"]
all_data = {}
for table in tables:
    rows = src.execute(f'SELECT * FROM "{table}"').fetchall()
    all_data[table] = [dict(r) for r in rows]
    print(f"  {table}: {len(rows)} rows")

src.close()

# Connect to PostgreSQL
dsn = "postgresql://user@localhost:5432/kawan_finance"
conn = psycopg2.connect(dsn)
conn.autocommit = False
cur = conn.cursor()

try:
    # Insert Categories
    for row in all_data["Category"]:
        cur.execute(
            'INSERT INTO "Category" (id, name, type, icon, color, "createdAt") VALUES (%s, %s, %s, %s, %s, to_timestamp(%s/1000.0))',
            (row["id"], row["name"], row["type"], row["icon"], row["color"], row["createdAt"])
        )
    print(f"  ✓ Categories imported")

    # Insert Transactions
    for row in all_data["Transaction"]:
        cur.execute(
            'INSERT INTO "Transaction" (id, amount, description, date, type, "isTransfer", "categoryId", "attachmentPath", "attachmentType", "createdAt") VALUES (%s, %s, %s, to_timestamp(%s/1000.0), %s, %s, %s, %s, %s, to_timestamp(%s/1000.0))',
            (row["id"], row["amount"], row["description"], row["date"], row["type"], bool(row["isTransfer"]), row["categoryId"], row["attachmentPath"], row["attachmentType"], row["createdAt"])
        )
    print(f"  ✓ Transactions imported")

    # Insert Debts
    for row in all_data["Debt"]:
        cur.execute(
            'INSERT INTO "Debt" (id, name, type, amount, "remainingAmount", "dueDate", notes, "isPaid", "createdAt") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, to_timestamp(%s/1000.0))',
            (row["id"], row["name"], row["type"], row["amount"], row["remainingAmount"], row["dueDate"], row["notes"], bool(row["isPaid"]), row["createdAt"])
        )
    print(f"  ✓ Debts imported")

    # Insert Investments
    for row in all_data["Investment"]:
        cur.execute(
            'INSERT INTO "Investment" (id, name, type, units, "buyPrice", "currentPrice", notes, "createdAt") VALUES (%s, %s, %s, %s, %s, %s, %s, to_timestamp(%s/1000.0))',
            (row["id"], row["name"], row["type"], row["units"], row["buyPrice"], row["currentPrice"], row["notes"], row["createdAt"])
        )
    print(f"  ✓ Investments imported")

    # Insert Budgets
    for row in all_data["Budget"]:
        cur.execute(
            'INSERT INTO "Budget" (id, month, year, amount, "categoryId", "createdAt") VALUES (%s, %s, %s, %s, %s, to_timestamp(%s/1000.0))',
            (row["id"], row["month"], row["year"], row["amount"], row["categoryId"], row["createdAt"])
        )
    print(f"  ✓ Budgets imported")

    conn.commit()
    print("✅ All data migrated successfully!")

except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
    raise
finally:
    cur.close()
    conn.close()
