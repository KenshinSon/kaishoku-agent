"use client";

import { useState } from "react";
import BookingEditModal from "./BookingEditModal";

type Booking = {
  id: string;
  status: string;
  preferredDate: string | null;
  guestCount: number | null;
  specialRequests: string | null;
  createdAt: string;
  venue: { id: string; name: string; address: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待機中",
  CONFIRMED: "確定",
  CANCELLED: "キャンセル",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  CONFIRMED: "bg-[#1A1E3C] text-[#FFED00] border-[#1A1E3C]",
  CANCELLED: "bg-red-50 text-red-400 border-red-100",
};

type Tab = "confirmed" | "pending" | "past";
const TABS: { id: Tab; label: string }[] = [
  { id: "confirmed", label: "確定済み" },
  { id: "pending", label: "待機中" },
  { id: "past", label: "過去の予約" },
];

function filterByTab(bookings: Booking[], tab: Tab): Booking[] {
  const now = new Date();
  if (tab === "confirmed") return bookings.filter((b) => b.status === "CONFIRMED");
  if (tab === "pending") return bookings.filter((b) => b.status === "PENDING");
  return bookings.filter(
    (b) =>
      b.status === "CANCELLED" ||
      (b.preferredDate !== null && new Date(b.preferredDate) < now)
  );
}

export default function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [tab, setTab] = useState<Tab>("pending");
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleSaved = (updated: { id: string; preferredDate: string | null; guestCount: number | null; specialRequests: string | null; venueName: string }) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === updated.id
          ? { ...b, preferredDate: updated.preferredDate, guestCount: updated.guestCount, specialRequests: updated.specialRequests }
          : b
      )
    );
    setEditTarget(null);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("この予約依頼をキャンセルしますか？")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/booking-requests/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b))
      );
    } finally {
      setCancelling(null);
    }
  };

  const displayed = filterByTab(bookings, tab);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === t.id
                ? "bg-[#1A1E3C] text-[#FFED00]"
                : "text-gray-500 hover:text-[#1A1E3C]"
            }`}
          >
            {t.label}
            {t.id !== "past" && (
              <span className="ml-1 opacity-60">
                ({filterByTab(bookings, t.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center text-gray-400 text-sm">
          {tab === "confirmed" && "確定済みの予約はありません"}
          {tab === "pending" && "待機中の予約依頼はありません"}
          {tab === "past" && "過去の予約はありません"}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((b) => {
            const created = new Date(b.createdAt);
            const createdStr = `${created.getFullYear()}/${created.getMonth() + 1}/${created.getDate()}`;
            return (
              <div key={b.id} className="bg-white border-2 border-[#1A1E3C] rounded-2xl px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-black text-[#1A1E3C] text-base truncate">{b.venue?.name ?? "—"}</p>
                    {b.venue?.address && (
                      <p className="text-xs text-gray-400 truncate">{b.venue.address}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      {b.preferredDate && (
                        <span>
                          📅{" "}
                          {new Date(b.preferredDate).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {b.guestCount && <span>👥 {b.guestCount}名</span>}
                      <span className="text-gray-300">依頼日: {createdStr}</span>
                    </div>
                    {b.specialRequests && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
                        {b.specialRequests}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                      STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>

                {b.status !== "CANCELLED" && (
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => setEditTarget(b)}
                      className="flex-1 border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold py-2 rounded-xl text-xs hover:bg-gray-50 transition-colors"
                    >
                      変更する
                    </button>
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                      className="flex-1 border-2 border-red-200 text-red-400 font-bold py-2 rounded-xl text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {cancelling === b.id ? "処理中…" : "キャンセルする"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editTarget && (
        <BookingEditModal
          booking={{
            id: editTarget.id,
            preferredDate: editTarget.preferredDate,
            guestCount: editTarget.guestCount,
            specialRequests: editTarget.specialRequests,
            venueName: editTarget.venue?.name ?? "—",
          }}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
