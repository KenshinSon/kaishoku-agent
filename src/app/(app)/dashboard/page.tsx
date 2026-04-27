import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ChatInput from "./_components/ChatInput";
import WeeklyReviewCard from "./_components/WeeklyReviewCard";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き", SEARCHING: "検索中", PROPOSED: "提案済み",
  CONFIRMED: "確定", COMPLETED: "完了", CANCELLED: "キャンセル",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  SEARCHING: "bg-blue-50 text-blue-600",
  PROPOSED: "bg-[#FFED00] text-[#1A1E3C]",
  CONFIRMED: "bg-[#1A1E3C] text-[#FFED00]",
  COMPLETED: "bg-gray-800 text-gray-200",
  CANCELLED: "bg-red-50 text-red-500",
};
const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  kaishoku_master: { emoji: "🏆", label: "会食マスター" },
  washoku_expert:  { emoji: "🍣", label: "和食通" },
  settai_master:   { emoji: "🤝", label: "接待の達人" },
};
const ALL_BADGE_KEYS = ["kaishoku_master", "washoku_expert", "settai_master"];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const firstName = session!.user.name?.split(/[\s　]/)[0] ?? session!.user.name ?? "";

  const now = new Date();

  // 今週（月〜日）
  const dow = now.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + daysToMon);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const next7 = new Date(now);
  next7.setDate(now.getDate() + 7);
  const next30 = new Date(now);
  next30.setDate(now.getDate() + 30);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const [
    draftCount,
    proposedCount,
    confirmedUpcomingCount,
    thisWeekCount,
    upcomingRaw,
    recentRaw,
    userPoint,
    userBadges,
    weeklyReviews,
    topReviewGroups,
  ] = await Promise.all([
    prisma.diningRequest.count({ where: { userId, status: "DRAFT" } }),
    prisma.diningRequest.count({ where: { userId, status: "PROPOSED" } }),
    prisma.diningRequest.count({
      where: { userId, status: "CONFIRMED", scheduledAt: { gte: now, lte: next7 } },
    }),
    prisma.diningRequest.count({
      where: { userId, status: { not: "TEMPLATE" }, scheduledAt: { gte: startOfWeek, lte: endOfWeek } },
    }),
    prisma.diningRequest.findMany({
      where: { userId, status: { not: "TEMPLATE" }, scheduledAt: { gte: now, lte: next30 } },
      include: {
        contact: true,
        recommendations: {
          where: { status: "ACTIVE" },
          include: { venues: { where: { isSelected: true }, include: { venue: { select: { name: true } } }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.diningRequest.findMany({
      where: { userId, status: { not: "TEMPLATE" }, scheduledAt: { lt: now } },
      include: {
        contact: true,
        recommendations: {
          where: { status: "ACTIVE" },
          include: { venues: { where: { isSelected: true }, include: { venue: { select: { name: true } } }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 3,
    }),
    prisma.userPoint.findUnique({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId } }),
    prisma.publicReview.findMany({
      where: { createdAt: { gte: weekAgo }, isPublic: true },
      include: {
        user: { select: { id: true, name: true, isPublicProfile: true } },
        venue: { select: { id: true, name: true, address: true, cuisineType: true } },
        helpfulVotes: { select: { userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.publicReview.groupBy({
      by: ["venueId"],
      _avg: { rating: true },
      _count: { rating: true },
      where: { isPublic: true },
      having: { rating: { _avg: { gte: 4 } } },
      orderBy: { _avg: { rating: "desc" } },
      take: 10,
    }),
  ]);

  // ユーザーの過去のcuisinePrefsを集計して推薦を絞り込む
  const pastRequests = await prisma.diningRequest.findMany({
    where: { userId, status: { not: "TEMPLATE" } },
    select: { cuisinePrefs: true },
    take: 20,
  });
  const cuisineCounts: Record<string, number> = {};
  for (const req of pastRequests) {
    for (const c of req.cuisinePrefs) {
      cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
    }
  }
  const topCuisine = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // おすすめ店舗の詳細を取得（cuisine一致優先、最大3件）
  const recVenueIds = topReviewGroups.map((g) => g.venueId);
  const recVenueDetails = recVenueIds.length > 0
    ? await prisma.venue.findMany({
        where: { id: { in: recVenueIds } },
        select: { id: true, name: true, address: true, cuisineType: true, nearestStation: true },
      })
    : [];
  const recLatestReviews = recVenueIds.length > 0
    ? await Promise.all(
        recVenueIds.map((vid) =>
          prisma.publicReview.findFirst({
            where: { venueId: vid, isPublic: true },
            orderBy: { createdAt: "desc" },
            select: { comment: true },
          })
        )
      )
    : [];

  // cuisine一致を優先して並び替え、最大3件
  const recVenueMap = Object.fromEntries(recVenueDetails.map((v) => [v.id, v]));
  const recommendedVenues = topReviewGroups
    .map((g, i) => ({
      venueId: g.venueId,
      avgRating: Math.round((g._avg.rating ?? 0) * 10) / 10,
      reviewCount: g._count.rating,
      venue: recVenueMap[g.venueId],
      latestComment: recLatestReviews[i]?.comment ?? null,
    }))
    .filter((r) => r.venue)
    .sort((a, b) => {
      if (!topCuisine) return 0;
      const aMatch = a.venue?.cuisineType === topCuisine ? -1 : 0;
      const bMatch = b.venue?.cuisineType === topCuisine ? -1 : 0;
      return aMatch - bMatch;
    })
    .slice(0, 3);

  // 今後・直近の会食を整形
  const upcoming = upcomingRaw.map((r) => ({
    id: r.id, status: r.status, scheduledAt: r.scheduledAt!,
    contact: r.contact,
    selectedVenueName: r.recommendations[0]?.venues[0]?.venue.name ?? null,
    source: r.source,
  }));
  const recent = recentRaw.map((r) => ({
    id: r.id, status: r.status, scheduledAt: r.scheduledAt!,
    contact: r.contact,
    selectedVenueName: r.recommendations[0]?.venues[0]?.venue.name ?? null,
    source: r.source,
  }));

  const earnedBadgeKeys = new Set(userBadges.map((b) => b.badgeType));
  const points = userPoint?.points ?? 0;

  const taskCards = [
    { icon: "📋", label: "提案待ち", count: draftCount, href: "/history?status=DRAFT" },
    { icon: "💡", label: "提案済み・未確定", count: proposedCount, href: "/history?status=PROPOSED" },
    { icon: "✅", label: "確定済み・今後7日", count: confirmedUpcomingCount, href: "/history?status=CONFIRMED" },
    { icon: "📅", label: "今週の会食", count: thisWeekCount, href: "/history" },
  ];

  return (
    <div className="bg-[#F8F7F4] -mx-6 -mt-8 -mb-8 px-6 pt-0 pb-12 min-h-screen">
      {/* ページヘッダー */}
      <div className="bg-[#FFED00] -mx-6 px-6 pt-8 pb-8 mb-8">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-2">Dashboard</p>
        <h1 className="text-3xl font-black text-[#1A1E3C] mb-1">こんにちは、{firstName}さん</h1>
        <p className="text-[#1A1E3C]/70 text-base">今日も最高の会食を。</p>
      </div>

      <div className="space-y-8">
        {/* Section 1: AIチャット */}
        <div className="bg-[#1A1E3C] rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-white text-xl font-black mb-1">🍽 AIに相談する</p>
              <p className="text-white/50 text-sm">エリア・人数・予算を話しかけるだけ</p>
            </div>
            <Link href="/chat" className="text-[#FFED00] text-xs font-medium hover:underline shrink-0 mt-1">
              チャットで詳しく相談 →
            </Link>
          </div>
          <ChatInput />
        </div>

        {/* Section 2: タスクカード */}
        <div>
          <h2 className="text-sm font-bold text-[#1A1E3C]/60 uppercase tracking-widest mb-3">アクションが必要なタスク</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {taskCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`bg-white border-2 border-[#1A1E3C] rounded-2xl p-5 hover:bg-[#FFFBE0] transition-colors ${card.count === 0 ? "opacity-40" : ""}`}
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className={`text-3xl font-black mb-1 ${card.count > 0 ? "text-[#1A1E3C]" : "text-gray-400"}`}>
                  {card.count}
                </div>
                <p className="text-xs text-gray-500 leading-snug">{card.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 3: 会食スケジュール */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#1A1E3C]/60 uppercase tracking-widest">今後の会食</h2>
            <Link href="/history" className="text-xs text-[#1A1E3C]/50 hover:text-[#1A1E3C] transition-colors">
              もっと見る →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-10 text-center text-gray-400 text-sm">
              今後30日以内の会食はありません
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((item) => <MeetingRow key={item.id} item={item} />)}
            </div>
          )}
          {recent.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold text-[#1A1E3C]/60 uppercase tracking-widest mb-3">最近の会食</h2>
              <div className="space-y-2">
                {recent.map((item) => <MeetingRow key={item.id} item={item} isPast />)}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: ポイント・おすすめ・今週の口コミ */}
        <div className="space-y-6">

          {/* 4-1: ポイント */}
          <div className="bg-[#FFED00] border-2 border-[#1A1E3C] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">⭐ 現在のポイント</p>
                <p className="text-4xl font-black text-[#1A1E3C] leading-none">
                  {points.toLocaleString()}
                  <span className="text-lg font-bold ml-1">pt</span>
                </p>
                {points === 0 && (
                  <p className="text-xs text-[#1A1E3C]/60 mt-2">
                    口コミを投稿してポイントを貯めよう！(+10pt)
                  </p>
                )}
              </div>
              {points > 0 && (
                <Link
                  href="/settings?tab=plan"
                  className="text-sm font-bold text-[#1A1E3C] underline hover:opacity-70 shrink-0 mt-1"
                >
                  500ptで予約代行チケットと交換 →
                </Link>
              )}
            </div>

            {/* バッジ */}
            <div className="flex flex-wrap gap-2 mt-4">
              {ALL_BADGE_KEYS.map((key) => {
                const meta = BADGE_META[key];
                const earned = earnedBadgeKeys.has(key);
                return (
                  <span
                    key={key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-colors ${
                      earned
                        ? "bg-[#1A1E3C] border-[#1A1E3C] text-white"
                        : "bg-white/40 border-[#1A1E3C]/20 text-[#1A1E3C]/30"
                    }`}
                  >
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 4-2: おすすめ店舗 */}
          {recommendedVenues.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#1A1E3C]/60 uppercase tracking-widest mb-3">
                あなたへのおすすめ店舗
                {topCuisine && <span className="normal-case font-normal ml-2 text-[#1A1E3C]/40">({topCuisine}好みに合わせて)</span>}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recommendedVenues.map(({ venueId, avgRating, reviewCount, venue, latestComment }) => (
                  <Link
                    key={venueId}
                    href={`/reviews?venueId=${venueId}`}
                    className="bg-white border-2 border-[#1A1E3C] rounded-xl p-4 flex-shrink-0 w-64 space-y-2 hover:bg-[#FFFBE0] transition-colors"
                  >
                    <div>
                      <p className="font-bold text-[#1A1E3C] text-sm leading-snug">{venue.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {[venue.nearestStation, venue.cuisineType].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="text-sm font-black text-[#1A1E3C]">{avgRating}</span>
                      <span className="text-xs text-gray-400">({reviewCount}件)</span>
                    </div>
                    {latestComment && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        「{latestComment.slice(0, 40)}{latestComment.length > 40 ? "…" : ""}」
                      </p>
                    )}
                    <p className="text-xs text-[#1A1E3C] font-medium">詳細を見る →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 4-3: 今週の口コミ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#1A1E3C]/60 uppercase tracking-widest">今週の口コミ</h2>
              <Link href="/reviews" className="text-xs text-[#1A1E3C]/50 hover:text-[#1A1E3C] transition-colors">
                すべての口コミを見る →
              </Link>
            </div>

            {weeklyReviews.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-10 text-center space-y-2">
                <p className="text-gray-400 text-sm">まだ今週の口コミがありません。最初の口コミを投稿してみましょう！</p>
                <Link href="/reviews" className="text-sm font-bold text-[#1A1E3C] underline">
                  口コミを書く →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyReviews.map((r) => (
                  <WeeklyReviewCard
                    key={r.id}
                    review={{
                      id: r.id,
                      rating: r.rating,
                      comment: r.comment,
                      businessScene: r.businessScene,
                      helpfulCount: r.helpfulCount,
                      createdAt: r.createdAt.toISOString(),
                      myVote: r.helpfulVotes.some((v) => v.userId === userId),
                      isMine: r.userId === userId,
                      userName: r.user.isPublicProfile ? r.user.name : null,
                      venueName: r.venue.name,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/requests/new"
          className="block w-full py-5 bg-[#1A1E3C] text-[#FFED00] font-black text-xl text-center rounded-2xl hover:bg-[#252b5c] transition-colors"
        >
          + 新しい会食を依頼する
        </Link>
      </div>
    </div>
  );
}

type MeetingItem = {
  id: string;
  status: string;
  scheduledAt: Date;
  contact: { name: string; title: string | null; companyName: string | null } | null;
  selectedVenueName: string | null;
  source: string | null;
};

function MeetingRow({ item, isPast = false }: { item: MeetingItem; isPast?: boolean }) {
  const d = item.scheduledAt;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const wd = WEEKDAY[d.getDay()];

  return (
    <Link
      href={`/requests/${item.id}/recommendations`}
      className={`flex items-center gap-4 bg-white border-2 border-[#1A1E3C] rounded-2xl px-5 py-4 hover:bg-[#FFFBE0] transition-colors ${isPast ? "opacity-60" : ""}`}
    >
      <div className="text-center shrink-0 w-12">
        <p className="text-xs text-gray-400">{month}月</p>
        <p className="text-2xl font-black text-[#1A1E3C] leading-none">{day}</p>
        <p className="text-xs text-gray-400">{wd}曜</p>
      </div>
      <div className="w-px h-10 bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {item.contact ? (
            <p className="font-bold text-[#1A1E3C] truncate">
              {item.contact.companyName && <span className="text-gray-400 font-normal text-sm">{item.contact.companyName} </span>}
              {item.contact.name}
              {item.contact.title && <span className="text-gray-400 font-normal text-xs ml-1">{item.contact.title}</span>}
            </p>
          ) : (
            <p className="text-gray-400 text-sm">担当者未設定</p>
          )}
          {item.source === "chat" && (
            <span className="bg-[#1A1E3C] text-white text-xs rounded-full px-2 py-0.5 shrink-0">💬 チャットから</span>
          )}
        </div>
        <p className="text-xs text-gray-500">{item.selectedVenueName ?? "店舗未確定"}</p>
      </div>
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 ${STATUS_COLOR[item.status] ?? "bg-gray-100 text-gray-500"}`}>
        {STATUS_LABEL[item.status] ?? item.status}
      </span>
    </Link>
  );
}
