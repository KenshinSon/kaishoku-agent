"use client";

import { useRouter } from "next/navigation";

const FEATURES = [
  "予約代行（電話での予約を代行）",
  "優先サポート",
  "会食ナレッジDB（チーム共有）",
  "無制限の提案回数",
];

export default function BookingUpgradeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#1A1E3C] text-xl leading-none transition-colors"
        >
          ×
        </button>

        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-3xl mb-3">🍽</p>
          <h2 className="text-xl font-black text-[#1A1E3C] leading-snug">
            予約代行はプレミアムプランの機能です
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            ビジめしが飲食店に電話して予約を代行します。確定後にSMSでご連絡します。
          </p>
        </div>

        {/* 特典リスト */}
        <div className="bg-[#F8F7F4] rounded-xl p-4 mb-6 space-y-2">
          <p className="text-xs font-bold text-[#1A1E3C]/60 uppercase tracking-widest mb-3">プレミアム特典</p>
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <span className="text-[#1A1E3C] font-black text-sm shrink-0">✅</span>
              <span className="text-sm text-[#1A1E3C]">{f}</span>
            </div>
          ))}
        </div>

        {/* 料金 */}
        <p className="text-center text-sm text-gray-500 mb-5">
          月額 <span className="font-black text-[#1A1E3C] text-lg">¥980</span>（税込）
        </p>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            onClick={() => go("/settings?tab=plan")}
            className="w-full py-3.5 bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-black rounded-xl text-sm hover:bg-[#ffe000] transition-colors"
          >
            プレミアムにアップグレード
          </button>
          <button
            onClick={() => go("/settings?tab=plan")}
            className="w-full py-3.5 bg-white border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            ポイントで交換する（500pt）
          </button>
        </div>
      </div>
    </div>
  );
}
