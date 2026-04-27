"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VenueSuggestion } from "@/lib/chat-parser";
import BookingUpgradeModal from "./BookingUpgradeModal";

export default function VenueSuggestionCards({
  venues,
  requestId,
}: {
  venues: VenueSuggestion[];
  requestId: string;
}) {
  const router = useRouter();
  const [bookingModal, setBookingModal] = useState(false);

  return (
    <div className="mt-2 space-y-2 w-full">
      {venues.map((v, i) => (
        <div
          key={i}
          className="bg-white border-2 border-[#1A1E3C] rounded-xl p-3"
        >
          {/* ランクバッジ + 店名 */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#FFED00] text-[#1A1E3C] font-black text-xs px-2 py-0.5 rounded-full shrink-0">
              #{i + 1}
            </span>
            <p className="font-bold text-[#1A1E3C] text-sm leading-tight">{v.name}</p>
          </div>

          {/* エリア・ジャンル・予算 */}
          <p className="text-xs text-gray-500 mb-1.5">
            {[v.area, v.genre, v.budgetRange].filter(Boolean).join(" · ")}
          </p>

          {/* 提案理由 */}
          <p className="text-sm text-gray-700 border-l-2 border-[#FFED00] pl-2 leading-relaxed mb-2">
            {v.reason}
          </p>

          {/* リンク */}
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(v.googleMapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1A1E3C] underline hover:opacity-70"
            >
              Google Maps 🗺
            </a>
            <a
              href={`https://tabelog.com/rst/s/?sw=${encodeURIComponent(v.tabelogQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1A1E3C] underline hover:opacity-70"
            >
              食べログで検索 🔍
            </a>
            <button
              type="button"
              onClick={() => setBookingModal(true)}
              className="text-xs text-gray-500 border border-gray-300 rounded-lg px-2 py-1 hover:border-[#1A1E3C] hover:text-[#1A1E3C] transition-colors"
            >
              📞 予約を依頼する
            </button>
          </div>
        </div>
      ))}

      {/* 詳細ページへ */}
      <button
        onClick={() => router.push(`/requests/${requestId}/recommendations`)}
        className="w-full py-3 bg-[#1A1E3C] text-[#FFED00] font-bold rounded-xl text-sm hover:bg-[#252b5c] transition-colors"
      >
        詳細を見る・店を確定する →
      </button>

      {bookingModal && <BookingUpgradeModal onClose={() => setBookingModal(false)} />}
    </div>
  );
}
