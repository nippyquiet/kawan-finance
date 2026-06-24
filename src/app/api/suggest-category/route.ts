import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Common words to skip when extracting category name from description
const COMMON_WORDS = new Set([
  "beli", "bayar", "isi", "topup", "transfer", "kirim", "potongan",
  "tagihan", "pembayaran", "langganan", "subscription", "order",
  "pesan", "di", "ke", "dan", "untuk", "yang", "dengan", "saya",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return Response.json({
      categoryId: null, category: null, confidence: 0,
      suggestedNewCategory: null,
    });
  }

  // Ambil semua transaksi dengan kategori
  const allTransactions = await prisma.transaction.findMany({
    where: {
      description: { not: "" },
      categoryId: { not: null },
    },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 500,
  });

  // Scoring existing categories
  const scores: Record<number, { categoryId: number; categoryName: string; icon: string | null; score: number; count: number }> = {};

  for (const tx of allTransactions) {
    const desc = tx.description.toLowerCase();
    let score = 0;

    if (desc === q) score = 100;
    else if (desc.startsWith(q)) score = 80;
    else if (q.startsWith(desc) && desc.length > 2) score = 70;
    else if (desc.includes(q)) score = 60;
    else {
      const words = q.split(/\s+/);
      const descWords = desc.split(/\s+/);
      const matchCount = words.filter((w: string) => w.length > 2 && descWords.some((dw: string) => dw.includes(w) || w.includes(dw))).length;
      if (matchCount > 0) {
        score = Math.min(50, matchCount * 15);
      } else continue;
    }

    const cid = tx.categoryId!;
    if (!scores[cid]) {
      scores[cid] = {
        categoryId: cid,
        categoryName: tx.category?.name || "",
        icon: tx.category?.icon || null,
        score: 0, count: 0,
      };
    }
    scores[cid].score += score;
    scores[cid].count += 1;
  }

  const ranked = Object.values(scores).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.count - a.count;
  });

  // Extract suggested new category name from description
  const suggestNewCategory = (desc: string): string | null => {
    const words = desc.split(/\s+/).filter(w => w.length > 2 && !COMMON_WORDS.has(w));
    if (words.length === 0) return null;
    // Take the most meaningful word (capitalize first letter)
    const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return name.length > 30 ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : name;
  };

  if (ranked.length > 0) {
    const best = ranked[0];
    const rawConfidence = Math.min(1, best.score / (best.count * 100));
    const countBonus = Math.min(0.3, best.count * 0.05);
    const confidence = Math.min(1, rawConfidence + countBonus);

    // If confidence is decent, return existing category
    if (confidence >= 0.4) {
      return Response.json({
        categoryId: best.categoryId,
        category: { name: best.categoryName, icon: best.icon },
        confidence: Math.round(confidence * 100) / 100,
        matchCount: best.count,
        suggestedNewCategory: null,
      });
    }
  }

  // No good match — suggest a new category from the description
  const suggestedName = suggestNewCategory(q);
  if (suggestedName) {
    // Check if name is too similar to an existing category
    const allCategories = await prisma.category.findMany();
    const similar = allCategories.find(c =>
      c.name.toLowerCase() === suggestedName.toLowerCase() ||
      c.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
      suggestedName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (!similar) {
      return Response.json({
        categoryId: null, category: null, confidence: 0,
        suggestedNewCategory: suggestedName,
      });
    }
    // Similar to existing — return that
    return Response.json({
      categoryId: similar.id,
      category: { name: similar.name, icon: similar.icon },
      confidence: 0.6,
      matchCount: 0,
      suggestedNewCategory: null,
    });
  }

  return Response.json({
    categoryId: null, category: null, confidence: 0,
    suggestedNewCategory: null,
  });
}
