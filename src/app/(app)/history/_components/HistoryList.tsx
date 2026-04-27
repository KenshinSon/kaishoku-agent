"use client";

import { useState } from "react";
import Link from "next/link";

const PRICE_LABEL: Record<number, string> = {
  0: "無料", 1: "〜¥3,000", 2: "¥3,000〜7,000", 3: "¥7,000〜15,000", 4: "¥15,000〜",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き", SEARCHING: "検索中", PROPOSED: "提案済み",
  CONFIRMED: "確定", COMPLETED: "完了", CANCELLED: "キャンセル",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  SEARCHING: "bg-blue-50 text-blue-600",
  PROPOSED: "bg-[#FFED00] text-[#1A1E3C]",
  CONFIRMED: "bg-[#1A1E3C] text-[#FFED00]",
  COMPLETED: "bg-gray-800 text-gray-200",
  CANCELLED: "bg-red-50 text-red-500",
};

const FILTERS = [
  { key: "all", label: "すべて" },
  { key: "CONFIRMED", label: "確定済み" },
  { key: "PROPOSED", label: "提案済み" },
  { key: "DRAFT", label: "下書き" },
] as const;

export type HistoryItem = {
  id: string;
  status: string;
  scheduledAt: string | null;
  totalGuests: number | null;
  purpose: string | null;
  budgetPerPerson: number | null;
  createdAt: string;
  contact: { name: string; title: string | null; companyName: string | null } | null;
  selectedVenueName: string | null;
};

export default function HistoryList({ items, initialFilter = "all" }: { items: HistoryItem[]; initialFilter?: string }) {
  const [filter, setFilter] = useState<"all" | string>(initialFilter);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      {/* フィルタータブ */}
      <div className="flex gap-0 border-2 border-[#1A1E3C] rounded-xl overflow-hidden w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-[#FFED00] text-[#1A1E3C] font-bold"
                : "bg-white text-gray-500 hover:text-[#1A1E3C]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center text-gray-400">
          該当する会食履歴がありません
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border-2 border-[#1A1E3C] rounded-2xl overflow-hidden">
              <div className="flex">
                <div className="w-2 bg-[#FFED00] shrink-0" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 ${STATUS_COLOR[item.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                        {item.contact ? (
                          <span className="font-bold text-[#1A1E3C]">
                            {item.contact.companyName && (
                              <span className="text-gray-400 font-normal text-sm">{item.contact.companyName} </span>
                            )}
                            {item.contact.name}
                            {item.contact.title && (
                              <span className="text-gray-400 font-normal text-xs ml-1">{item.contact.title}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">担当者未設定</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        {item.scheduledAt && (
                          <span>
                            {new Date(item.scheduledAt).toLocaleDateString("ja-JP", {
                              year: "numeric", month: "long", day: "numeric", weekday: "short",
                            })}
                          </span>
                        )}
                        {item.totalGuests && <span>{item.totalGuests}名</span>}
                        {item.purpose && <span>{item.purpose}</span>}
                        {item.budgetPerPerson && <span>¥{item.budgetPerPerson.toLocaleString()}/人</span>}
                      </div>
                      {item.selectedVenueName && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-[#1A1E3C] font-bold">✓</span>
                          <span className="font-medium text-[#1A1E3C]">{item.selectedVenueName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/requests/${item.id}/recommendations`}
                      className="px-3 py-1.5 text-xs border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-lg hover:bg-[#FFED00] transition-colors"
                    >
                      詳細を見る
                    </Link>
                    {item.status === "CONFIRMED" && (
                      <Link
                        href={`/requests/${item.id}/template`}
                        className="px-3 py-1.5 text-xs bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-lg hover:bg-[#ffe000] transition-colors"
                      >
                        テンプレを見る
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
