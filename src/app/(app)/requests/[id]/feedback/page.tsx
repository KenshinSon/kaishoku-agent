import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import FeedbackForm from "./_components/FeedbackForm";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const diningRequest = await prisma.diningRequest.findUnique({
    where: { id, userId: session!.user.id },
    include: { contact: true },
  });
  if (!diningRequest) notFound();

  // 既にフィードバック済みならダッシュボードへ
  const existingFeedback = await prisma.feedback.findFirst({
    where: { userId: session!.user.id, diningRequestId: id },
  });
  if (existingFeedback) redirect("/dashboard");

  // 確定済みの店舗を取得
  const recommendation = await prisma.recommendation.findFirst({
    where: { diningRequestId: id, status: "ACTIVE" },
    include: { venues: { where: { isSelected: true }, include: { venue: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const selectedVenue = recommendation?.venues[0] ?? null;
  const venueId = selectedVenue?.venue.id ?? null;
  const recommendationId = recommendation?.id ?? null;

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <Link href="/dashboard" className="text-xs text-[#1A1E3C]/60 hover:text-[#1A1E3C] mb-2 inline-block">
          ← ダッシュボード
        </Link>
        <h1 className="text-2xl font-black text-[#1A1E3C]">会食のふりかえり</h1>
        {diningRequest.contact && (
          <p className="text-sm text-[#1A1E3C]/70 mt-1">
            {diningRequest.contact.companyName && `${diningRequest.contact.companyName} `}
            {diningRequest.contact.name}
            {diningRequest.contact.title && ` （${diningRequest.contact.title}）`}
            との会食
          </p>
        )}
        {selectedVenue && (
          <p className="text-sm font-bold text-[#1A1E3C] mt-1">
            {selectedVenue.venue.name}
          </p>
        )}
      </div>

      <FeedbackForm
        requestId={id}
        venueId={venueId}
        recommendationId={recommendationId}
      />
    </div>
  );
}
