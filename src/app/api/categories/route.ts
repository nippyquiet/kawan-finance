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

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { type: "asc" } });
  const response = NextResponse.json(categories);
  response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const existing = await prisma.category.findFirst({
    where: { name: { equals: body.name }, type: body.type || "EXPENSE" },
  });
  if (existing) return Response.json(existing, { status: 200 });
  const icon = body.icon || suggestIcon(body.name);
  const category = await prisma.category.create({
    data: { name: body.name, type: body.type || "EXPENSE", icon, color: body.color || "#6b7280" },
  });
  return Response.json(category, { status: 201 });
}
