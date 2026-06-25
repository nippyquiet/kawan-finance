import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type PocketRow = Awaited<ReturnType<typeof prisma.pocket.findFirst>> extends infer T ? NonNullable<T> : never;

async function requireUser() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user?.email) return null;

  await prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name ?? null, image: user.image ?? null },
    create: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
    },
  });

  return { id: user.id, email: user.email };
}

async function attachComputedBalances(pockets: PocketRow[]) {
  if (pockets.length === 0) return [];

  const pocketIds = pockets.map(p => p.id);
  const grouped = await prisma.transaction.groupBy({
    by: ["pocketId", "type"],
    where: { pocketId: { in: pocketIds } },
    _sum: { amount: true },
  });

  const balances = new Map<number, number>();
  for (const row of grouped) {
    if (!row.pocketId) continue;
    const current = balances.get(row.pocketId) || 0;
    const amount = row._sum.amount || 0;
    balances.set(row.pocketId, current + (row.type === "INCOME" ? amount : -amount));
  }

  return pockets.map(p => ({ ...p, balance: balances.get(p.id) || 0 }));
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json([], { status: 401 });

  let pockets = await prisma.pocket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (pockets.length === 0) {
    const defaultPocket = await prisma.pocket.create({
      data: { name: "Utama", emoji: "👛", isDefault: true, userId: user.id },
    });
    pockets = [defaultPocket];
  }

  return NextResponse.json(await attachComputedBalances(pockets));
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const pocket = await prisma.pocket.create({
    data: {
      name: String(body.name || "").trim(),
      emoji: body.emoji || "👛",
      userId: user.id,
    },
  });

  const [withBalance] = await attachComputedBalances([pocket]);
  return NextResponse.json(withBalance, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = Number(body.id);
  const name = String(body.name || "").trim();
  const emoji = String(body.emoji || "👛").trim() || "👛";

  if (!id || !name) {
    return NextResponse.json({ error: "ID dan nama pocket wajib diisi" }, { status: 400 });
  }

  const existing = await prisma.pocket.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Pocket tidak ditemukan" }, { status: 404 });

  const pocket = await prisma.pocket.update({
    where: { id },
    data: { name, emoji },
  });

  const [withBalance] = await attachComputedBalances([pocket]);
  return NextResponse.json(withBalance);
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID pocket wajib diisi" }, { status: 400 });

  const pocket = await prisma.pocket.findFirst({ where: { id, userId: user.id } });
  if (!pocket) return NextResponse.json({ error: "Pocket tidak ditemukan" }, { status: 404 });
  if (pocket.isDefault) return NextResponse.json({ error: "Pocket default tidak bisa dihapus" }, { status: 400 });

  const [transactions, debts, budgets, investments, recurring] = await Promise.all([
    prisma.transaction.count({ where: { pocketId: id } }),
    prisma.debt.count({ where: { pocketId: id } }),
    prisma.budget.count({ where: { pocketId: id } }),
    prisma.investment.count({ where: { pocketId: id } }),
    prisma.recurringTransaction.count({ where: { pocketId: id } }),
  ]);

  const usedBy = transactions + debts + budgets + investments + recurring;
  if (usedBy > 0) {
    return NextResponse.json(
      { error: `Pocket ini punya ${usedBy} data terkait. Pindahkan/hapus datanya dulu sebelum menghapus pocket.` },
      { status: 400 }
    );
  }

  await prisma.pocket.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
