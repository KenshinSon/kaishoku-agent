"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BUSINESS_RESULTS = ["商談が進んだ", "関係が深まった", "まあまあ", "うまくいかなかった"];

const DETAIL_RATINGS = [
  { key: "ratingService",   icon: "🤵", label: "接客・サービス" },
  { key: "ratingSeating",   icon: "🪑", label: "席環境・広さ" },
  { key: "ratingFood",      icon: "🍱", label: "料理のクオリティ" },
  { key: "ratingDrink",     icon: "🍶", label: "ドリンクの品質" },
  { key: "ratingCostPerf",  icon: "💰", label: "コスパ" },
  { key: "ratingQuietness", icon: "🔇", label: "静かさ・会話しやすさ" },
] as const;

type DetailKey = typeof DETAIL_RATINGS[number]["key"];

interface Props {
  requestId: string;
  venueId: string | null;
  recommendationId: string | null;
}

export default function FeedbackForm({ requestId, venueId, recommendationId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [details, setDetails] = useState<Record<DetailKey, number>>(
    Object.fromEntries(DETAIL_RATINGS.map((r) => [r.key, 0])) as Record<DetailKey, number>
  );
  const [businessResult, setBusinessResult] = useState("");
  const [wouldRevisit, setWouldRevisit] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating) { setError("総合評価を選択してください"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diningRequestId: requestId,
          venueId,
          recommendationId,
          rating,
          comment,
          privateNote,
          businessResult,
          wouldRevisit,
          ...Object.fromEntries(
            DETAIL_RATINGS.map((r) => [r.key, details[r.key] || null])
          ),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error === "Already submitted" ? "すでに評価が送信済みです" : "送信に失敗しました");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: 総合評価 */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-3">
        <h2 className="font-black text-[#1A1E3C]">総合評価</h2>
        <div className="flex items-center gap-2">
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-[#1A1E3C] font-black text-2xl ml-2">{rating}</span>
          )}
        </div>
        {rating === 0 && <p className="text-xs text-gray-400">星をクリックして評価してください</p>}
      </div>

      {/* Section 2: 詳細評価 */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-4">
        <h2 className="font-black text-[#1A1E3C]">店舗の詳細評価</h2>
        <div className="grid grid-cols-2 gap-4">
          {DETAIL_RATINGS.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <p className="text-sm text-gray-600">
                {item.icon} {item.label}
              </p>
              <StarRating
                value={details[item.key]}
                onChange={(v) => setDetails((prev) => ({ ...prev, [item.key]: v }))}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: 会食の結果 */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-5">
        <h2 className="font-black text-[#1A1E3C]">会食の結果</h2>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">ビジネス的な成果</p>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_RESULTS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setBusinessResult(businessResult === r ? "" : r)}
                className={`px-4 py-2 rounded-full text-sm border-2 font-medium transition-colors ${
                  businessResult === r
                    ? "bg-[#FFED00] border-[#FFED00] text-[#1A1E3C] font-bold"
                    : "bg-white border-[#1A1E3C] text-[#1A1E3C] hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">また行きたいですか？</p>
          <div className="flex gap-3">
            {[
              { label: "はい", value: true },
              { label: "いいえ", value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setWouldRevisit(wouldRevisit === value ? null : value)}
                className={`px-6 py-2 rounded-xl border-2 text-sm font-bold transition-colors ${
                  wouldRevisit === value
                    ? "bg-[#1A1E3C] border-[#1A1E3C] text-[#FFED00]"
                    : "bg-white border-[#1A1E3C] text-[#1A1E3C] hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: メモ */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-4">
        <h2 className="font-black text-[#1A1E3C]">メモ</h2>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">口コミ・コメント（任意）</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="店舗・料理・サービスの感想など"
            className={inp}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">内部メモ（非公開・任意）</label>
          <textarea
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            rows={3}
            placeholder="次回の提案時に活かしたいメモ、気づきなど"
            className={inp}
          />
          <p className="text-xs text-gray-400">次回の提案精度向上に使われます。外部には公開されません。</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-4 bg-[#1A1E3C] text-[#FFED00] font-black text-lg rounded-2xl hover:bg-[#252b5c] transition-colors disabled:opacity-50"
      >
        {submitting ? "送信中..." : "ふりかえりを送信する"}
      </button>
    </div>
  );
}

function StarRating({
  value, onChange, size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "lg" ? "text-5xl" : size === "md" ? "text-2xl" : "text-xl";
  const active = hovered || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`${sizeClass} transition-colors leading-none`}
        >
          <span className={active >= star ? "text-[#FFED00]" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

const inp = "w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] bg-white transition-colors";
