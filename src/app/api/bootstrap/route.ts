import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAnalytics } from "@/lib/analytics";

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
  return { id: user.id, email: user.email, name: user.name ?? null, image: user.image ?? null };
}

async function ensureUser(user: { id: string; email: string; name?: string | null; image?: string | null }) {
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

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const requestedPocketId = Number(searchParams.get("pocketId"));

  let pockets = await prisma.pocket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (pockets.length === 0) {
    await ensureUser(user);
    const defaultPocket = await prisma.pocket.create({
      data: { name: "Utama", emoji: "👛", isDefault: true, userId: user.id },
    });
    pockets = [defaultPocket];
  }

  const pocketsWithBalance = await attachComputedBalances(pockets);
  const activePocket = pocketsWithBalance.find(p => p.id === requestedPocketId) || pocketsWithBalance.find(p => p.isDefault) || pocketsWithBalance[0] || null;
  const analytics = activePocket ? await getAnalytics(activePocket.id) : null;

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    pockets: pocketsWithBalance,
    activePocketId: activePocket?.id ?? null,
    analytics,
    fetchedAt: Date.now(),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
