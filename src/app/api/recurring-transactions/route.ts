import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pocketId = searchParams.get("pocketId");
  const where: any = {};
  if (pocketId) where.pocketId = parseInt(pocketId);

  const items = await prisma.recurringTransaction.findMany({
    where,
    include: { category: true },
    orderBy: [{ isActive: "desc" }, { nextDate: "asc" }],
  });
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const item = await prisma.recurringTransaction.create({
    data: {
      description: body.description,
      amount: body.amount,
      type: body.type || "EXPENSE",
      frequency: body.frequency || "MONTHLY",
      startDate: new Date(body.startDate || new Date()),
      endDate: body.endDate ? new Date(body.endDate) : null,
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
      isActive: body.isActive !== false,
      dayOfMonth: body.dayOfMonth || null,
      dayOfWeek: body.dayOfWeek || null,
      categoryId: body.categoryId || null,
      pocketId: body.pocketId || null,
      notes: body.notes || null,
    },
    include: { category: true },
  });
  return Response.json(item, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const item = await prisma.recurringTransaction.update({
    where: { id: body.id },
    data: {
      description: body.description,
      amount: body.amount,
      type: body.type,
      frequency: body.frequency,
      isActive: body.isActive,
      dayOfMonth: body.dayOfMonth,
      dayOfWeek: body.dayOfWeek,
      categoryId: body.categoryId,
      notes: body.notes,
      nextDate: body.nextDate ? new Date(body.nextDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
    include: { category: true },
  });
  return Response.json(item);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await prisma.recurringTransaction.delete({ where: { id: parseInt(id) } });
  return Response.json({ ok: true });
}
