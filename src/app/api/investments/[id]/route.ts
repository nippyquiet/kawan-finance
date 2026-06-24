import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.investment.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.units !== undefined) data.units = parseFloat(body.units);
  if (body.buyPrice !== undefined) data.buyPrice = parseFloat(body.buyPrice);
  if (body.currentPrice !== undefined) data.currentPrice = parseFloat(body.currentPrice);
  if (body.notes !== undefined) data.notes = body.notes;
  const investment = await prisma.investment.update({
    where: { id: parseInt(id) },
    data,
  });
  return Response.json(investment);
}
