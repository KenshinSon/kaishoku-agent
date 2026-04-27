"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  requestId: string;
  recommendationVenueId: string;
  venueName: string;
}

export default function SelectVenueButton({ requestId, recommendationVenueId, venueName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = async () => {
    if (!window.confirm(`「${venueName}」を確定してよろしいですか？`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dining-requests/${requestId}/recommend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationVenueId }),
      });
      if (!res.ok) throw new Error();
      setConfirmed(true);
      router.refresh();
    } catch {
      alert("確定に失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <span className="px-4 py-2 bg-[#1A1E3C] text-[#FFED00] rounded-xl text-sm font-bold">
        確定済み
      </span>
    );
  }

  return (
    <button
      onClick={handleSelect}
      disabled={loading}
      className="px-4 py-2 bg-[#FFED00] text-[#1A1E3C] font-black border-2 border-[#1A1E3C] rounded-xl text-sm hover:bg-[#ffe000] transition-colors disabled:opacity-50 shrink-0"
    >
      {loading ? "確定中..." : "この店にする"}
    </button>
  );
}
