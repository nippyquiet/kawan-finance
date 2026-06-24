import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const text = await request.text();
  const lines = text.split("\n").filter(l => l.trim());
  const errors: string[] = [];
  let imported = 0;

  // Get all categories for matching
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));

  // Skip header
  const dataLines = lines.slice(1);

  for (let i = 0; i < dataLines.length; i++) {
    try {
      const parts = dataLines[i].split(",");
      if (parts.length < 4) {
        errors.push(`Baris ${i + 2}: format salah`);
        continue;
      }

      const date = parts[0].trim();
      const amount = parseInt(parts[1].trim().replace(/[^0-9]/g, ""));
      const type = parts[2].trim().toUpperCase();
      const catName = parts[3].trim();
      const description = parts.slice(4).join(",").trim() || catName;

      if (!amount) {
        errors.push(`Baris ${i + 2}: amount tidak valid`);
        continue;
      }
      if (type !== "EXPENSE" && type !== "INCOME") {
        errors.push(`Baris ${i + 2}: type harus EXPENSE/INCOME`);
        continue;
      }

      const catKey = catName.toLowerCase();
      let categoryId: number | null = null;
      for (const [name, cat] of catMap) {
        if (name.includes(catKey) || catKey.includes(name)) {
          categoryId = cat.id;
          break;
        }
      }

      await prisma.transaction.create({
        data: {
          amount,
          description: description || catName,
          date: new Date(date),
          type,
          categoryId,
        },
      });
      imported++;
    } catch (e: any) {
      errors.push(`Baris ${i + 2}: ${e.message}`);
    }
  }

  return Response.json({ imported, errors });
}
