import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addPoints } from "@/lib/points";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  const rating = searchParams.get("rating");
  const businessScene = searchParams.get("businessScene");

  const reviews = await prisma.publicReview.findMany({
    where: {
      isPublic: true,
      ...(venueId ? { venueId } : {}),
      ...(rating ? { rating: Number(rating) } : {}),
      ...(businessScene ? { businessScene } : {}),
    },
    include: {
      user: { select: { id: true, name: true, isPublicProfile: true } },
      venue: { select: { id: true, name: true, address: true, cuisineType: true } },
      helpfulVotes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    venueId, rating, comment, businessScene, wouldRevisit,
    ratingService, ratingSeating, ratingFood, ratingDrink, ratingCostPerf, ratingQuietness,
  } = await request.json();

  if (!venueId || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "venueId, rating, comment は必須です" }, { status: 400 });
  }

  const review = await prisma.publicReview.create({
    data: {
      userId: session.user.id,
      venueId,
      rating,
      comment: comment.trim(),
      businessScene: businessScene || null,
      wouldRevisit: wouldRevisit ?? null,
      ratingService: ratingService ?? null,
      ratingSeating: ratingSeating ?? null,
      ratingFood: ratingFood ?? null,
      ratingDrink: ratingDrink ?? null,
      ratingCostPerf: ratingCostPerf ?? null,
      ratingQuietness: ratingQuietness ?? null,
    },
  });

  await addPoints(session.user.id, 10, "review_post", review.id);

  return NextResponse.json(review, { status: 201 });
}
