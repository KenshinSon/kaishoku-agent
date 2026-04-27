"use client";

import { useState } from "react";

type Booking = {
  id: string;
  preferredDate: string | null;
  guestCount: number | null;
  specialRequests: string | null;
  venueName: string;
};

type Props = {
  booking: Booking;
  onClose: () => void;
  onSaved: (updated: Booking) => void;
};

export default function BookingEditModal({ booking, onClose, onSaved }: Props) {
  const [preferredDate, setPreferredDate] = useState(
    booking.preferredDate ? new Date(booking.preferredDate).toISOString().slice(0, 16) : ""
  );
  const [guestCount, setGuestCount] = useState(booking.guestCount?.toString() ?? "");
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/booking-requests/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredDate: preferredDate || null,
          guestCount: guestCount ? parseInt(guestCount, 10) : null,
          specialRequests: specialRequests || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      const updated = await res.json();
      onSaved({
        id: updated.id,
        preferredDate: updated.preferredDate,
        guestCount: updated.guestCount,
        specialRequests: updated.specialRequests,
        venueName: booking.venueName,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border-2 border-[#1A1E3C] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-xs text-[#1A1E3C]/50 font-medium uppercase tracking-widest mb-0.5">Edit Booking</p>
          <h2 className="text-lg font-black text-[#1A1E3C]">{booking.venueName}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1E3C] mb-1">希望日時</label>
            <input
              type="datetime-local"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#1A1E3C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1E3C] mb-1">人数</label>
            <input
              type="number"
              min={1}
              max={100}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              placeholder="例: 4"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#1A1E3C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1E3C] mb-1">特別リクエスト</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              placeholder="アレルギー、個室希望など"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#1A1E3C] focus:outline-none resize-none"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#FFED00] text-[#1A1E3C] font-black py-3 rounded-xl text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
