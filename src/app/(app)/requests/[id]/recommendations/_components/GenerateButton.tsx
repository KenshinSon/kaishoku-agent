"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dining-requests/${requestId}/recommend`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "生成に失敗しました");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#FFED00] z-50 flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-black text-[#1A1E3C]">AIが最適なお店を探しています</h2>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#1A1E3C] animate-bounce"
              style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </div>
        <p className="text-sm text-[#1A1E3C]/70">Google Places → スコアリング → AI分析中</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 whitespace-pre-wrap">{error}</p>
      )}
      <button
        onClick={handleGenerate}
        className="px-4 py-2 text-sm border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-xl hover:bg-[#FFED00] transition-colors"
      >
        再提案する
      </button>
    </div>
  );
}
