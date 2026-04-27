"use client";

import { useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  businessScene: string | null;
  helpfulCount: number;
  createdAt: string;
  myVote: boolean;
  isMine: boolean;
  userName: string | null;
  venueName: string;
};

export default function WeeklyReviewCard({ review }: { review: Review }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [voted, setVoted] = useState(review.myVote);
  const [voting, setVoting] = useState(false);

  const handleHelpful = async () => {
    if (review.isMine || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setVoted(data.voted);
      setHelpfulCount((c) => c + (data.voted ? 1 : -1));
    } finally {
      setVoting(false);
    }
  };

  const d = new Date(review.createdAt);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

  return (
    <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1A1E3C] text-sm truncate">{review.venueName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-sm ${s <= review.rating ? "text-[#FFED00]" : "text-gray-200"}`}>★</span>
              ))}
            </div>
            {review.businessScene && (
              <span className="text-xs text-gray-500">{review.businessScene}</span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-300 shrink-0">{dateStr}</span>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">
        {review.comment.length > 60 ? review.comment.slice(0, 60) + "…" : review.comment}
      </p>

      <div className="flex items-center justify-between pt-0.5">
        <p className="text-xs text-gray-400">{review.userName ?? "匿名"}</p>
        {!review.isMine && (
          <button
            onClick={handleHelpful}
            disabled={voting}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
              voted
                ? "bg-[#1A1E3C] border-[#1A1E3C] text-[#FFED00]"
                : "bg-white border-gray-200 text-gray-500 hover:border-[#1A1E3C] hover:text-[#1A1E3C]"
            }`}
          >
            👍 役に立った{helpfulCount > 0 && <span className="ml-0.5">{helpfulCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
