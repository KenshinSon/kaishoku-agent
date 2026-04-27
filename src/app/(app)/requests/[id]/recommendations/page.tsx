import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GenerateButton from "./_components/GenerateButton";
import SelectVenueButton from "./_components/SelectVenueButton";
import CautionToggle from "./_components/CautionToggle";
import FavoriteButton from "./_components/FavoriteButton";
import BookingRequestButton from "./_components/BookingRequestButton";

const PRICE_LABEL: Record<number, string> = {
  0: "無料", 1: "〜¥3,000", 2: "¥3,000〜7,000", 3: "¥7,000〜15,000", 4: "¥15,000〜",
};

export default async function RecommendationsPage({
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

  const recommendation = await prisma.recommendation.findFirst({
    where: { diningRequestId: id, status: "ACTIVE" },
    include: { venues: { include: { venue: true }, orderBy: { rank: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session!.user.id },
    select: { id: true, venueId: true },
  });
  const favoriteMap = Object.fromEntries(favorites.map((f) => [f.venueId, f.id]));

  const mainVenues = recommendation?.venues.filter((v) => !v.isBackup) ?? [];
  const backupVenues = recommendation?.venues.filter((v) => v.isBackup) ?? [];
  const isConfirmed = diningRequest.status === "CONFIRMED";

  // 口コミサマリーを取得
  const allVenueIds = recommendation?.venues.map((v) => v.venue.id) ?? [];
  const reviewSummaries = allVenueIds.length > 0
    ? await Promise.all(
        allVenueIds.map(async (venueId) => {
          const [agg, latest] = await Promise.all([
            prisma.publicReview.aggregate({
              where: { venueId, isPublic: true },
              _avg: { rating: true },
              _count: { id: true },
            }),
            prisma.publicReview.findFirst({
              where: { venueId, isPublic: true },
              orderBy: { createdAt: "desc" },
              select: { comment: true },
            }),
          ]);
          return {
            venueId,
            avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
            count: agg._count.id,
            latestComment: latest?.comment ?? null,
          };
        })
      )
    : [];
  const reviewMap = Object.fromEntries(reviewSummaries.map((s) => [s.venueId, s]));

  return (
    <div className="space-y-0">
      {/* タイトルエリア: イエロー帯 */}
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs text-[#1A1E3C]/60 hover:text-[#1A1E3C] mb-2 inline-block">
              ← ダッシュボード
            </Link>
            <h1 className="text-2xl font-black text-[#1A1E3C]">お店の提案</h1>
            {diningRequest.contact && (
              <p className="text-sm text-[#1A1E3C]/70 mt-1">
                {diningRequest.contact.companyName && `${diningRequest.contact.companyName} `}
                {diningRequest.contact.name}
                {diningRequest.contact.title && ` （${diningRequest.contact.title}）`}
                との会食
              </p>
            )}
          </div>
          {recommendation && !isConfirmed && <GenerateButton requestId={id} />}
        </div>
      </div>

      <div className="space-y-6">
        {/* 確定バナー */}
        {isConfirmed && (
          <div className="bg-[#1A1E3C] rounded-2xl px-5 py-4 flex items-center justify-between">
            <p className="text-[#FFED00] font-bold">✓ 店舗が確定しました</p>
            <Link
              href={`/requests/${id}/template`}
              className="px-4 py-2 bg-[#FFED00] text-[#1A1E3C] font-black rounded-xl text-sm hover:bg-[#ffe000] transition-colors"
            >
              確定連絡テンプレを作成 →
            </Link>
          </div>
        )}

        {/* 未提案 */}
        {!recommendation ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-24 flex flex-col items-center gap-5">
            <p className="text-gray-400">まだ提案がありません</p>
            <GenerateButton requestId={id} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              {mainVenues.map((rv) => (
                <VenueCard
                  key={rv.id}
                  rv={rv}
                  requestId={id}
                  isConfirmed={isConfirmed}
                  favoriteId={favoriteMap[rv.venue.id] ?? null}
                  reviewSummary={reviewMap[rv.venue.id] ?? null}
                />
              ))}
            </div>

            {backupVenues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <p className="text-xs text-gray-400 font-medium tracking-wide whitespace-nowrap">
                    満席時の代替候補
                  </p>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {backupVenues.map((rv) => (
                    <VenueCard
                      key={rv.id}
                      rv={rv}
                      requestId={id}
                      isBackup
                      isConfirmed={isConfirmed}
                      favoriteId={favoriteMap[rv.venue.id] ?? null}
                      reviewSummary={reviewMap[rv.venue.id] ?? null}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type RV = {
  id: string; rank: number; reason: string; cautionNote: string | null; isSelected: boolean;
  venue: { id: string; name: string; address: string | null; rating: number | null; priceLevel: number | null; googleMapsUrl: string | null; };
};

type ReviewSummary = { venueId: string; avgRating: number | null; count: number; latestComment: string | null } | null;

function VenueCard({ rv, requestId, isBackup = false, isConfirmed, favoriteId, reviewSummary }: {
  rv: RV; requestId: string; isBackup?: boolean; isConfirmed: boolean; favoriteId: string | null; reviewSummary: ReviewSummary;
}) {
  const venue = rv.venue;
  const tabelogUrl = `https://tabelog.com/rst/s/?sw=${encodeURIComponent(venue.name)}`;
  const isTop = !isBackup && rv.rank === 1;

  return (
    <div className={`bg-white rounded-2xl overflow-hidden ${
      isTop ? "border-4 border-[#FFED00]" : "border-2 border-[#1A1E3C]"
    } ${rv.isSelected ? "ring-2 ring-green-400 ring-offset-2" : ""}`}>
      {/* ランクバッジ行 */}
      <div className={`px-5 py-2 flex items-center justify-between ${
        isTop ? "bg-[#FFED00]" : isBackup ? "bg-gray-100" : "bg-[#1A1E3C]"
      }`}>
        <span className={`text-sm font-black ${isTop ? "text-[#1A1E3C]" : isBackup ? "text-gray-500" : "text-white"}`}>
          {isBackup ? "代替" : `#${rv.rank}`}
          {rv.isSelected && " ✓ 確定"}
        </span>
        {!isConfirmed && !rv.isSelected && (
          <SelectVenueButton requestId={requestId} recommendationVenueId={rv.id} venueName={venue.name} />
        )}
      </div>

      {/* カード本体 */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-black text-[#1A1E3C] text-lg">{venue.name}</h3>
          {venue.address && <p className="text-xs text-gray-500 mt-0.5">{venue.address}</p>}
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            {venue.rating && (
              <span className="flex items-center gap-1">
                <span className="text-amber-400 text-sm">★</span>
                {venue.rating.toFixed(1)}
              </span>
            )}
            {venue.priceLevel !== null && venue.priceLevel !== undefined && (
              <span>{PRICE_LABEL[venue.priceLevel]}</span>
            )}
          </div>
        </div>

        {/* 理由（左縦線） */}
        <div className="flex gap-3">
          <div className="w-1 bg-[#FFED00] rounded-full shrink-0" />
          <p className="text-sm text-gray-700 leading-relaxed">{rv.reason}</p>
        </div>

        {rv.cautionNote && <CautionToggle note={rv.cautionNote} />}

        {/* 口コミサマリー */}
        {reviewSummary && reviewSummary.count > 0 && (
          <div className="bg-[#F8F7F4] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1A1E3C]">ユーザー口コミ</span>
              {reviewSummary.avgRating !== null && (
                <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                  <span>★</span>{reviewSummary.avgRating}
                </span>
              )}
              <span className="text-xs text-gray-400">{reviewSummary.count}件</span>
            </div>
            {reviewSummary.latestComment && (
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                「{reviewSummary.latestComment}」
              </p>
            )}
          </div>
        )}

        {/* リンク */}
        <div className="flex items-center gap-2 pt-1">
          {venue.googleMapsUrl && (
            <a href={venue.googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg text-gray-600 hover:border-[#1A1E3C] hover:text-[#1A1E3C] transition-colors font-medium">
              Google Maps
            </a>
          )}
          <a href={tabelogUrl} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg text-gray-600 hover:border-[#1A1E3C] hover:text-[#1A1E3C] transition-colors font-medium">
            食べログで検索
          </a>
          <FavoriteButton venueId={venue.id} initialFavoriteId={favoriteId} />
          <BookingRequestButton
            venueId={venue.id}
            diningRequestId={requestId}
            recommendationVenueId={rv.id}
          />
        </div>
        {rv.isSelected && (
          <div className="pt-1">
            <Link
              href={`/requests/${requestId}/feedback`}
              className="text-sm font-medium text-[#1A1E3C] underline"
            >
              ふりかえりを書く →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
