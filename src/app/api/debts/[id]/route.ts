import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.debt.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.remainingAmount !== undefined) data.remainingAmount = body.remainingAmount;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.isPaid !== undefined) data.isPaid = body.isPaid;
  const debt = await prisma.debt.update({ where: { id: parseInt(id) }, data });
  return Response.json(debt);
}
