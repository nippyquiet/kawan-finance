import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.transaction.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.description !== undefined) data.description = body.description;
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.type !== undefined) data.type = body.type;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
  if (body.attachmentPath !== undefined) data.attachmentPath = body.attachmentPath;
  if (body.attachmentType !== undefined) data.attachmentType = body.attachmentType;

  const transaction = await prisma.transaction.update({
    where: { id: parseInt(id) },
    data,
    include: { category: true },
  });
  return Response.json(transaction);
}
