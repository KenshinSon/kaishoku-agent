import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReviewsClient from "./_components/ReviewsClient";

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const reviews = await prisma.publicReview.findMany({
    where: { isPublic: true },
    include: {
      user: { select: { id: true, name: true, isPublicProfile: true } },
      venue: { select: { id: true, name: true, address: true, cuisineType: true } },
      helpfulVotes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    myVote: r.helpfulVotes.some((v) => v.userId === uid),
  }));

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">Reviews</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">みんなの口コミ</h1>
        <p className="text-sm text-[#1A1E3C]/60 mt-1">実際に会食で利用した店舗のリアルな声</p>
      </div>
      <ReviewsClient reviews={serialized} currentUserId={uid} />
    </div>
  );
}
