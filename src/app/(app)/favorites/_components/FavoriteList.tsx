"use client";

import { useState } from "react";

const PRICE_LABEL: Record<number, string> = {
  0: "無料", 1: "〜¥3,000", 2: "¥3,000〜7,000", 3: "¥7,000〜15,000", 4: "¥15,000〜",
};

export type FavoriteItem = {
  id: string;
  memo: string | null;
  createdAt: string;
  venue: {
    id: string;
    name: string;
    address: string | null;
    rating: number | null;
    priceLevel: number | null;
    googleMapsUrl: string | null;
  };
};

export default function FavoriteList({ initialItems }: { initialItems: FavoriteItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("お気に入りから削除しますか？")) return;
    setDeleting(id);
    try {
      await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center text-gray-400">
        お気に入りの店がまだありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const tabelogUrl = `https://tabelog.com/rst/s/?sw=${encodeURIComponent(item.venue.name)}`;
        return (
          <div key={item.id} className="bg-white border-2 border-[#1A1E3C] rounded-2xl overflow-hidden">
            <div className="flex">
              <div className="w-2 bg-[#FFED00] shrink-0" />
              <div className="flex-1 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-black text-[#1A1E3C] text-lg">{item.venue.name}</h3>
                    {item.venue.address && (
                      <p className="text-xs text-gray-500">{item.venue.address}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {item.venue.rating && (
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          {item.venue.rating.toFixed(1)}
                        </span>
                      )}
                      {item.venue.priceLevel !== null && item.venue.priceLevel !== undefined && (
                        <span>{PRICE_LABEL[item.venue.priceLevel]}</span>
                      )}
                    </div>
                    {item.memo && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{item.memo}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="shrink-0 px-3 py-1.5 text-xs border-2 border-red-200 text-red-400 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === item.id ? "削除中..." : "削除"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {item.venue.googleMapsUrl && (
                    <a
                      href={item.venue.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg text-gray-600 hover:border-[#1A1E3C] hover:text-[#1A1E3C] transition-colors font-medium"
                    >
                      Google Maps
                    </a>
                  )}
                  <a
                    href={tabelogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg text-gray-600 hover:border-[#1A1E3C] hover:text-[#1A1E3C] transition-colors font-medium"
                  >
                    食べログで検索
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
