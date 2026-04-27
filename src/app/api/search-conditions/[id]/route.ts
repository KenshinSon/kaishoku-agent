import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const template = await prisma.diningRequest.findUnique({ where: { id } });
  if (!template || template.userId !== session.user.id || template.status !== "TEMPLATE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.diningRequest.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
