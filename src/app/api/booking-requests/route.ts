import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.bookingRequest.findMany({
    where: { userId: session.user.id },
    include: {
      venue: { select: { id: true, name: true, address: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venueId, diningRequestId, recommendationVenueId, preferredDate, guestCount, specialRequests } =
    await request.json();

  if (!venueId) return NextResponse.json({ error: "venueId is required" }, { status: 400 });

  // ポイント残高でプランを簡易判定（将来: premium フラグで判定）
  const point = await prisma.userPoint.findUnique({ where: { userId: session.user.id } });
  const planType = point && point.points >= 500 ? "point" : "free";

  const booking = await prisma.bookingRequest.create({
    data: {
      userId: session.user.id,
      venueId,
      diningRequestId: diningRequestId ?? null,
      recommendationVenueId: recommendationVenueId ?? null,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      guestCount: guestCount ?? null,
      specialRequests: specialRequests || null,
      planType,
    },
  });

  return NextResponse.json({ id: booking.id, status: booking.status, isPremiumRequired: false }, { status: 201 });
}
