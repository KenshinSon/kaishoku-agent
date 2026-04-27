"use client";

import { useState } from "react";

interface Props {
  venueId: string;
  initialFavoriteId: string | null;
}

export default function FavoriteButton({ venueId, initialFavoriteId }: Props) {
  const [favoriteId, setFavoriteId] = useState<string | null>(initialFavoriteId);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (favoriteId) {
        await fetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
        setFavoriteId(null);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId }),
        });
        const data = await res.json();
        setFavoriteId(data.id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={favoriteId ? "お気に入りから削除" : "お気に入りに追加"}
      className={`px-3 py-1.5 text-base border-2 rounded-lg transition-colors disabled:opacity-50 ${
        favoriteId
          ? "bg-[#FFED00] border-[#1A1E3C] text-[#1A1E3C]"
          : "border-gray-200 text-gray-400 hover:border-[#1A1E3C] hover:text-[#1A1E3C]"
      }`}
    >
      {favoriteId ? "♥" : "♡"}
    </button>
  );
}
