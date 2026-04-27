import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { venue: { select: { id: true, name: true, address: true, rating: true, priceLevel: true, googleMapsUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(favorites);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venueId, memo } = await request.json();
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });

  const favorite = await prisma.favorite.upsert({
    where: { userId_venueId: { userId: session.user.id, venueId } },
    update: { memo: memo ?? null },
    create: { userId: session.user.id, venueId, memo: memo ?? null },
  });
  return NextResponse.json(favorite, { status: 201 });
}
