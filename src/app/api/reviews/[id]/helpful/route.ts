import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addPoints } from "@/lib/points";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewId } = await params;

  const review = await prisma.publicReview.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId === session.user.id) {
    return NextResponse.json({ error: "自分の口コミには投票できません" }, { status: 400 });
  }

  const existing = await prisma.reviewHelpful.findUnique({
    where: { reviewId_userId: { reviewId, userId: session.user.id } },
  });

  if (existing) {
    // トグル: 取り消し
    await prisma.$transaction([
      prisma.reviewHelpful.delete({ where: { id: existing.id } }),
      prisma.publicReview.update({ where: { id: reviewId }, data: { helpfulCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ voted: false });
  }

  await prisma.$transaction([
    prisma.reviewHelpful.create({ data: { reviewId, userId: session.user.id } }),
    prisma.publicReview.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } }),
  ]);

  await addPoints(review.userId, 5, "helpful_vote", reviewId);

  return NextResponse.json({ voted: true }, { status: 201 });
}
