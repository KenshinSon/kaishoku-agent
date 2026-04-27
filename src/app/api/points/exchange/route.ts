import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addPoints } from "@/lib/points";

const TICKET_COST = 500;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const point = await prisma.userPoint.findUnique({ where: { userId: uid } });
  if (!point || point.points < TICKET_COST) {
    return NextResponse.json({ error: `ポイントが不足しています（必要: ${TICKET_COST}pt）` }, { status: 400 });
  }

  await addPoints(uid, -TICKET_COST, "ticket_exchange");

  return NextResponse.json({ ok: true });
}
