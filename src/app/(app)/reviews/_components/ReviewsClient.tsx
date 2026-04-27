"use client";

import { useState } from "react";

const BUSINESS_SCENES = ["接待", "商談", "関係構築", "採用", "クロージング"];
const RATING_OPTIONS = [5, 4, 3, 2, 1];
const DETAIL_LABELS: { key: string; label: string }[] = [
  { key: "ratingService",   label: "接客" },
  { key: "ratingSeating",   label: "席" },
  { key: "ratingFood",      label: "料理" },
  { key: "ratingDrink",     label: "ドリンク" },
  { key: "ratingCostPerf",  label: "コスパ" },
  { key: "ratingQuietness", label: "静かさ" },
];

type Review = {
  id: string;
  rating: number;
  ratingService: number | null;
  ratingSeating: number | null;
  ratingFood: number | null;
  ratingDrink: number | null;
  ratingCostPerf: number | null;
  ratingQuietness: number | null;
  comment: string;
  businessScene: string | null;
  wouldRevisit: boolean | null;
  helpfulCount: number;
  createdAt: string;
  myVote: boolean;
  user: { id: string; name: string | null; isPublicProfile: boolean };
  venue: { id: string; name: string; address: string | null; cuisineType: string | null };
};

export default function ReviewsClient({
  reviews: initialReviews,
  currentUserId,
}: {
  reviews: Review[];
  currentUserId: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filterScene, setFilterScene] = useState("");
  const [filterRating, setFilterRating] = useState(0);
  const [votingId, setVotingId] = useState<string | null>(null);

  const filtered = reviews.filter((r) => {
    if (filterScene && r.businessScene !== filterScene) return false;
    if (filterRating && r.rating < filterRating) return false;
    return true;
  });

  const handleHelpful = async (reviewId: string) => {
    setVotingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
      if (!res.ok) return;
      const { voted } = await res.json();
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, myVote: voted, helpfulCount: r.helpfulCount + (voted ? 1 : -1) }
            : r
        )
      );
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterScene}
          onChange={(e) => setFilterScene(e.target.value)}
          className="px-3 py-2 border-2 border-[#1A1E3C] rounded-xl text-sm font-medium bg-white text-[#1A1E3C] focus:outline-none"
        >
          <option value="">シーン: すべて</option>
          {BUSINESS_SCENES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(Number(e.target.value))}
          className="px-3 py-2 border-2 border-[#1A1E3C] rounded-xl text-sm font-medium bg-white text-[#1A1E3C] focus:outline-none"
        >
          <option value={0}>評価: すべて</option>
          {RATING_OPTIONS.map((r) => <option key={r} value={r}>★{r}以上</option>)}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length}件</span>
      </div>

      {filtered.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center text-gray-400">
          口コミがまだありません
        </div>
      )}

      {filtered.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isMine={review.user.id === currentUserId}
          onHelpful={() => handleHelpful(review.id)}
          voting={votingId === review.id}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review, isMine, onHelpful, voting,
}: {
  review: Review;
  isMine: boolean;
  onHelpful: () => void;
  voting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const d = new Date(review.createdAt);
  const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;

  const detailScores = DETAIL_LABELS.filter(
    ({ key }) => review[key as keyof Review] !== null
  );

  return (
    <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-5 space-y-3">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#1A1E3C] text-base">{review.venue.name}</p>
          {review.venue.address && (
            <p className="text-xs text-gray-400 truncate">{review.venue.address}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`text-lg ${s <= review.rating ? "text-[#FFED00]" : "text-gray-200"}`}>★</span>
          ))}
          <span className="font-black text-[#1A1E3C] ml-1">{review.rating}</span>
        </div>
      </div>

      {/* タグ */}
      <div className="flex flex-wrap gap-1.5">
        {review.businessScene && (
          <span className="px-2.5 py-0.5 bg-[#FFED00] text-[#1A1E3C] text-xs font-bold rounded-full">
            {review.businessScene}
          </span>
        )}
        {review.venue.cuisineType && (
          <span className="px-2.5 py-0.5 border border-gray-200 text-gray-500 text-xs rounded-full">
            {review.venue.cuisineType}
          </span>
        )}
        {review.wouldRevisit !== null && (
          <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${
            review.wouldRevisit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }`}>
            {review.wouldRevisit ? "また行きたい" : "再訪なし"}
          </span>
        )}
      </div>

      {/* コメント */}
      <p className="text-sm text-gray-700 leading-relaxed">
        {review.comment.length > 120 && !expanded
          ? <>{review.comment.slice(0, 120)}<button onClick={() => setExpanded(true)} className="text-[#1A1E3C] font-medium ml-1">…もっと見る</button></>
          : review.comment}
      </p>

      {/* 詳細スコア */}
      {detailScores.length > 0 && (
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 pt-1">
          {detailScores.map(({ key, label }) => {
            const val = review[key as keyof Review] as number;
            return (
              <div key={key} className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-12 shrink-0">{label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-xs ${s <= val ? "text-[#FFED00]" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* フッター */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-gray-400">
          {review.user.isPublicProfile ? review.user.name : "匿名ユーザー"}
          <span className="ml-2">{dateStr}</span>
        </div>
        {!isMine && (
          <button
            onClick={onHelpful}
            disabled={voting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition-colors disabled:opacity-50 ${
              review.myVote
                ? "bg-[#1A1E3C] border-[#1A1E3C] text-[#FFED00]"
                : "bg-white border-gray-200 text-gray-500 hover:border-[#1A1E3C] hover:text-[#1A1E3C]"
            }`}
          >
            👍 役に立った {review.helpfulCount > 0 && <span>{review.helpfulCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
