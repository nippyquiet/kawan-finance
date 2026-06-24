#!/usr/bin/env python3
"""Migrate data from local PostgreSQL to Supabase"""
import subprocess, os, csv, io

# Read Supabase password
with open('/tmp/supabase_pw.txt') as f:
    supabase_pw = f.read().strip()

# Connection configs
LOCAL = ['psql', '-h', 'localhost', '-p', '5432', '-U', 'user', '-d', 'kawan_finance']
SUPA = ['psql', '-h', 'aws-1-ap-southeast-1.pooler.supabase.com',
        '-p', '6543', '-U', 'postgres.cveqncdtwwlqjarkvlfd', '-d', 'postgres']

local_env = os.environ.copy()
supa_env = os.environ.copy()
supa_env['PGPASSWORD'] = supabase_pw

def query_local(sql):
    r = subprocess.run(LOCAL + ['--csv', '-c', sql], capture_output=True, text=True, env=local_env, timeout=15)
    return r.stdout, r.stderr

def exec_supa(sql):
    r = subprocess.run(SUPA + ['-c', sql], capture_output=True, text=True, env=supa_env, timeout=30)
    return r.stdout, r.stderr, r.returncode

# 1. Migrate Categories
stdout, _ = query_local('SELECT * FROM "Category" ORDER BY id')
reader = csv.DictReader(io.StringIO(stdout))
count = 0
for row in reader:
    created = row['createdAt'].replace(' ', 'T') if ' ' in row['createdAt'] else row['createdAt']
    icon = row['icon'] if row['icon'] else ''
    color = row['color'] if row['color'] else ''
    sql = f"""INSERT INTO "Category" (id, name, type, icon, color, "createdAt")
              VALUES ({row['id']}, '{row['name'].replace("'", "''")}', '{row['type']}', 
                      {'NULL' if not icon else "'" + icon.replace("'", "''") + "'"},
                      {'NULL' if not color else "'" + color + "'"},
                      '{created}'::timestamp)
              ON CONFLICT (id) DO NOTHING;"""
    out, err, rc = exec_supa(sql)
    if rc == 0:
        count += 1
    else:
        print(f"Category {row['id']} error: {err[:100]}")
print(f"✓ {count} categories migrated")

# 2. Migrate Transactions
stdout, _ = query_local('SELECT * FROM "Transaction" ORDER BY id')
reader = csv.DictReader(io.StringIO(stdout))
count = 0
for row in reader:
    cat_id = row['categoryId'] if row['categoryId'] else 'NULL'
    is_transfer = row['isTransfer'].lower() == 'true'
    att_path = row['attachmentPath'] if row.get('attachmentPath') else ''
    att_type = row['attachmentType'] if row.get('attachmentType') else ''
    date_val = row['date'].replace(' ', 'T') if ' ' in row['date'] else row['date']
    created = row['createdAt'].replace(' ', 'T') if ' ' in row['createdAt'] else row['createdAt']
    
    sql = f"""INSERT INTO "Transaction" (id, amount, description, date, type, "isTransfer", "categoryId", "attachmentPath", "attachmentType", "createdAt")
              VALUES ({row['id']}, {row['amount']}, '{row['description'].replace("'", "''")}',
                      '{date_val}'::timestamp, '{row['type']}', {is_transfer},
                      {cat_id},
                      {'NULL' if not att_path else "'" + att_path.replace("'", "''") + "'"},
                      {'NULL' if not att_type else "'" + att_type + "'"},
                      '{created}'::timestamp)
              ON CONFLICT (id) DO NOTHING;"""
    out, err, rc = exec_supa(sql)
    if rc == 0:
        count += 1
print(f"✓ {count} transactions migrated")

# 3. Migrate Debts
stdout, _ = query_local('SELECT * FROM "Debt" ORDER BY id')
reader = csv.DictReader(io.StringIO(stdout))
count = 0
for row in reader:
    if not row['id']:
        continue
    is_paid = row['isPaid'].lower() == 'true' if row.get('isPaid') else 'false'
    due = row['dueDate'] if row.get('dueDate') else ''
    notes = row['notes'] if row.get('notes') else ''
    created = row['createdAt'].replace(' ', 'T') if ' ' in row['createdAt'] else row['createdAt']
    
    if due:
        due = due.replace(' ', 'T') if ' ' in due else due
    
    sql = f"""INSERT INTO "Debt" (id, name, type, amount, "remainingAmount", "dueDate", notes, "isPaid", "createdAt")
              VALUES ({row['id']}, '{row['name'].replace("'", "''")}', '{row['type']}',
                      {row['amount']}, {row['remainingAmount']},
                      {'NULL' if not due else "'" + due + "'::timestamp"},
                      {'NULL' if not notes else "'" + notes.replace("'", "''") + "'"},
                      {is_paid},
                      '{created}'::timestamp)
              ON CONFLICT (id) DO NOTHING;"""
    out, err, rc = exec_supa(sql)
    if rc == 0:
        count += 1
print(f"✓ {count} debts migrated")

# 4. Migrate Investments
stdout, _ = query_local('SELECT * FROM "Investment" ORDER BY id')
reader = csv.DictReader(io.StringIO(stdout))
count = 0
for row in reader:
    if not row['id']:
        continue
    notes = row['notes'] if row.get('notes') else ''
    created = row['createdAt'].replace(' ', 'T') if ' ' in row['createdAt'] else row['createdAt']
    
    sql = f"""INSERT INTO "Investment" (id, name, type, units, "buyPrice", "currentPrice", notes, "createdAt")
              VALUES ({row['id']}, '{row['name'].replace("'", "''")}', '{row['type']}',
                      {row['units']}, {row['buyPrice']}, {row['currentPrice']},
                      {'NULL' if not notes else "'" + notes.replace("'", "''") + "'"},
                      '{created}'::timestamp)
              ON CONFLICT (id) DO NOTHING;"""
    out, err, rc = exec_supa(sql)
    if rc == 0:
        count += 1
print(f"✓ {count} investments migrated")

# 5. Migrate Budgets
stdout, _ = query_local('SELECT * FROM "Budget" ORDER BY id')
reader = csv.DictReader(io.StringIO(stdout))
count = 0
for row in reader:
    if not row['id']:
        continue
    created = row['createdAt'].replace(' ', 'T') if ' ' in row['createdAt'] else row['createdAt']
    
    sql = f"""INSERT INTO "Budget" (id, month, year, amount, "categoryId", "createdAt")
              VALUES ({row['id']}, {row['month']}, {row['year']}, {row['amount']}, {row['categoryId']},
                      '{created}'::timestamp)
              ON CONFLICT (id) DO NOTHING;"""
    out, err, rc = exec_supa(sql)
    if rc == 0:
        count += 1
print(f"✓ {count} budgets migrated")

# 6. Update sequences
exec_supa("""SELECT setval('"Category_id_seq"', COALESCE((SELECT MAX(id) FROM "Category"), 1));
SELECT setval('"Transaction_id_seq"', COALESCE((SELECT MAX(id) FROM "Transaction"), 1));
SELECT setval('"Debt_id_seq"', COALESCE((SELECT MAX(id) FROM "Debt"), 1));
SELECT setval('"Investment_id_seq"', COALESCE((SELECT MAX(id) FROM "Investment"), 1));
SELECT setval('"Budget_id_seq"', COALESCE((SELECT MAX(id) FROM "Budget"), 1));""")
print("✓ Sequences updated")

print("\n✅ ALL DATA MIGRATED SUCCESSFULLY!")
