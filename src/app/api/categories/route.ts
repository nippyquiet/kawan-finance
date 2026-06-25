import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMOJI_MAP: Record<string, string> = {
  bensin: "⛽", bbm: "⛽", parkir: "🅿️", tol: "🛣️",
  gojek: "🛵", grab: "🛵", ojek: "🛵", taksi: "🚕",
  listrik: "⚡", air: "💧", wifi: "📶", pulsa: "📱", internet: "📡",
  kopi: "☕", cafe: "☕", restoran: "🍽️", makan: "🍽️",
  baju: "👕", sepatu: "👟", fashion: "👔",
  buku: "📖", kursus: "🎓", belajar: "📚",
  olahraga: "🏃", gym: "🏋️", sport: "⚽",
  donasi: "🤲", sedekah: "🤲", amal: "🤲", infaq: "🤲",
  pajak: "🧾", bpjs: "🏥",
  netflix: "🎬", spotify: "🎵", youtube: "▶️", streaming: "📺",
  invest: "📈", saham: "📊", crypto: "🪙", emas: "🥇",
  gaji: "💰", bonus: "🎁", dividen: "💵",
  freelance: "💼", project: "💼",
};

function suggestIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return "📌";
}

function normalizeType(type?: string) {
  return type === "INCOME" ? "INCOME" : "EXPENSE";
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  const response = NextResponse.json(categories);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const type = normalizeType(body.type);

  if (!name) return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });

  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, type },
  });
  if (existing) return NextResponse.json(existing, { status: 200 });

  const icon = body.icon || suggestIcon(name);
  const category = await prisma.category.create({
    data: { name, type, icon, color: body.color || "#6b7280" },
  });

  return NextResponse.json(category, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const id = Number(body.id);
  const name = String(body.name || "").trim();
  const type = normalizeType(body.type);
  const icon = String(body.icon || "").trim() || suggestIcon(name);

  if (!id || !name) return NextResponse.json({ error: "ID dan nama kategori wajib diisi" }, { status: 400 });

  const existing = await prisma.category.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

  const duplicate = await prisma.category.findFirst({
    where: { id: { not: id }, name: { equals: name, mode: "insensitive" }, type },
  });
  if (duplicate) return NextResponse.json({ error: "Kategori dengan nama dan tipe ini sudah ada" }, { status: 400 });

  const category = await prisma.category.update({
    where: { id },
    data: { name, type, icon, color: body.color || existing.color || "#6b7280" },
  });

  return NextResponse.json(category);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID kategori wajib diisi" }, { status: 400 });

  const category = await prisma.category.findFirst({ where: { id } });
  if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

  const [transactions, budgets, recurring] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id } }),
    prisma.budget.count({ where: { categoryId: id } }),
    prisma.recurringTransaction.count({ where: { categoryId: id } }),
  ]);

  const usedBy = transactions + budgets + recurring;
  if (usedBy > 0) {
    return NextResponse.json(
      { error: `Kategori ini dipakai oleh ${usedBy} data. Ubah/hapus data terkait dulu sebelum menghapus kategori.` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
