import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    diningRequestId, venueId, recommendationId,
    rating, comment, privateNote,
    ratingService, ratingSeating, ratingFood, ratingDrink, ratingCostPerf, ratingQuietness,
    businessResult, wouldRevisit,
  } = await request.json();

  // 既存チェック（同じ依頼に重複送信しない）
  if (diningRequestId) {
    const existing = await prisma.feedback.findFirst({
      where: { userId: session.user.id, diningRequestId },
    });
    if (existing) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      diningRequestId: diningRequestId ?? null,
      venueId: venueId ?? null,
      recommendationId: recommendationId ?? null,
      rating: rating ?? null,
      comment: comment || null,
      privateNote: privateNote || null,
      ratingService: ratingService ?? null,
      ratingSeating: ratingSeating ?? null,
      ratingFood: ratingFood ?? null,
      ratingDrink: ratingDrink ?? null,
      ratingCostPerf: ratingCostPerf ?? null,
      ratingQuietness: ratingQuietness ?? null,
      businessResult: businessResult || null,
      wouldRevisit: wouldRevisit ?? null,
    },
  });

  // venue.averageRatingを再計算
  if (venueId) {
    const avg = await prisma.feedback.aggregate({
      where: { venueId, rating: { not: null } },
      _avg: { rating: true },
    });
    if (avg._avg.rating !== null) {
      await prisma.venue.update({
        where: { id: venueId },
        data: { averageRating: avg._avg.rating },
      });
    }
  }

  return NextResponse.json(feedback, { status: 201 });
}
