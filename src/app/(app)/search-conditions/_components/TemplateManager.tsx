"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CUISINE_OPTIONS = ["和食", "海鮮", "寿司", "焼鳥", "肉", "中華", "イタリアン"];
const DRINK_OPTIONS = ["日本酒", "ワイン", "ビール", "焼酎", "ノンアル"];
const ATMOSPHERE_OPTIONS = ["静かめ", "ほどよく落ち着き", "賑やか"];
const PRIVATE_ROOM_OPTIONS = ["個室必須", "半個室可", "こだわらない"];
const SMOKING_OPTIONS = ["禁煙のみ", "分煙可", "喫煙可"];

const PRICE_LABEL: Record<number, string> = {
  0: "無料", 1: "〜¥3,000", 2: "¥3,000〜7,000", 3: "¥7,000〜15,000", 4: "¥15,000〜",
};

export type TemplateItem = {
  id: string;
  templateName: string | null;
  preferredArea: string | null;
  budgetPerPerson: number | null;
  totalGuests: number | null;
  cuisinePrefs: string[];
  drinkPrefs: string[];
  atmosphereNote: string | null;
  privateRoom: string | null;
  smokingPolicy: string | null;
  createdAt: string;
};

type ModalForm = {
  templateName: string;
  preferredArea: string;
  budgetPerPerson: string;
  totalGuests: string;
  cuisinePrefs: string[];
  drinkPrefs: string[];
  atmosphereNote: string;
  privateRoom: string;
  smokingPolicy: string;
};

const emptyForm: ModalForm = {
  templateName: "", preferredArea: "", budgetPerPerson: "", totalGuests: "",
  cuisinePrefs: [], drinkPrefs: [], atmosphereNote: "", privateRoom: "", smokingPolicy: "",
};

export default function TemplateManager({ initialTemplates }: { initialTemplates: TemplateItem[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ModalForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const toggle = (key: "cuisinePrefs" | "drinkPrefs", val: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter((v) => v !== val) : [...prev[key], val],
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/search-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTemplates((prev) => [
        {
          id: created.id,
          templateName: created.templateName,
          preferredArea: created.preferredArea,
          budgetPerPerson: created.budgetPerPerson,
          totalGuests: created.totalGuests,
          cuisinePrefs: created.cuisinePrefs,
          drinkPrefs: created.drinkPrefs,
          atmosphereNote: created.atmosphereNote,
          privateRoom: created.privateRoom,
          smokingPolicy: created.smokingPolicy,
          createdAt: created.createdAt,
        },
        ...prev,
      ]);
      setForm(emptyForm);
      setShowModal(false);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("この検索条件を削除しますか？")) return;
    setDeleting(id);
    try {
      await fetch(`/api/search-conditions/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 bg-[#1A1E3C] text-[#FFED00] font-bold text-sm rounded-xl hover:bg-[#252b5c] transition-colors shrink-0"
      >
        + 新しい検索条件を保存
      </button>

      {templates.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center text-gray-400">
          保存した検索条件がありません
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white border-2 border-[#1A1E3C] rounded-2xl overflow-hidden">
              <div className="flex">
                <div className="w-2 bg-[#FFED00] shrink-0" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <h3 className="font-black text-[#1A1E3C] text-base">
                        {t.templateName || "（名前なし）"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        {t.preferredArea && <span>📍 {t.preferredArea}</span>}
                        {t.budgetPerPerson && <span>💴 ¥{t.budgetPerPerson.toLocaleString()}/人</span>}
                        {t.totalGuests && <span>👥 {t.totalGuests}名</span>}
                        {t.atmosphereNote && <span>{t.atmosphereNote}</span>}
                        {t.privateRoom && <span>{t.privateRoom}</span>}
                      </div>
                      {(t.cuisinePrefs.length > 0 || t.drinkPrefs.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {t.cuisinePrefs.map((c) => (
                            <span key={c} className="text-xs bg-[#FFFBE0] border border-[#FFED00] text-[#1A1E3C] px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                          {t.drinkPrefs.map((d) => (
                            <span key={d} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="shrink-0 px-3 py-1.5 text-xs border-2 border-red-200 text-red-400 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50"
                    >
                      {deleting === t.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                  <button
                    onClick={() => router.push(`/requests/new?template=${t.id}`)}
                    className="px-4 py-2 bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold text-sm rounded-xl hover:bg-[#ffe000] transition-colors"
                  >
                    このテンプレで依頼作成 →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl border-2 border-[#1A1E3C] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <h2 className="text-lg font-black text-[#1A1E3C]">新しい検索条件を保存</h2>

            <LabelField label="テンプレート名">
              <input type="text" value={form.templateName} onChange={(e) => setForm((p) => ({ ...p, templateName: e.target.value }))} placeholder="例: 銀座・接待向け" className={inp} />
            </LabelField>

            <LabelField label="希望エリア">
              <input type="text" value={form.preferredArea} onChange={(e) => setForm((p) => ({ ...p, preferredArea: e.target.value }))} placeholder="例: 銀座・丸の内" className={inp} />
            </LabelField>

            <div className="grid grid-cols-2 gap-4">
              <LabelField label="予算（円/人）">
                <input type="number" value={form.budgetPerPerson} onChange={(e) => setForm((p) => ({ ...p, budgetPerPerson: e.target.value }))} placeholder="15000" className={inp} />
              </LabelField>
              <LabelField label="人数">
                <input type="number" value={form.totalGuests} onChange={(e) => setForm((p) => ({ ...p, totalGuests: e.target.value }))} placeholder="4" className={inp} />
              </LabelField>
            </div>

            <LabelField label="料理ジャンル">
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((opt) => (
                  <Chip key={opt} label={opt} active={form.cuisinePrefs.includes(opt)} onClick={() => toggle("cuisinePrefs", opt)} />
                ))}
              </div>
            </LabelField>

            <LabelField label="ドリンク">
              <div className="flex flex-wrap gap-2">
                {DRINK_OPTIONS.map((opt) => (
                  <Chip key={opt} label={opt} active={form.drinkPrefs.includes(opt)} onClick={() => toggle("drinkPrefs", opt)} />
                ))}
              </div>
            </LabelField>

            <LabelField label="雰囲気">
              <div className="flex flex-wrap gap-2">
                {ATMOSPHERE_OPTIONS.map((opt) => (
                  <Chip key={opt} label={opt} active={form.atmosphereNote === opt} onClick={() => setForm((p) => ({ ...p, atmosphereNote: p.atmosphereNote === opt ? "" : opt }))} />
                ))}
              </div>
            </LabelField>

            <LabelField label="個室">
              <div className="flex flex-wrap gap-2">
                {PRIVATE_ROOM_OPTIONS.map((opt) => (
                  <Chip key={opt} label={opt} active={form.privateRoom === opt} onClick={() => setForm((p) => ({ ...p, privateRoom: p.privateRoom === opt ? "" : opt }))} />
                ))}
              </div>
            </LabelField>

            <LabelField label="喫煙">
              <div className="flex flex-wrap gap-2">
                {SMOKING_OPTIONS.map((opt) => (
                  <Chip key={opt} label={opt} active={form.smokingPolicy === opt} onClick={() => setForm((p) => ({ ...p, smokingPolicy: p.smokingPolicy === opt ? "" : opt }))} />
                ))}
              </div>
            </LabelField>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#1A1E3C] text-[#FFED00] font-bold rounded-xl text-sm hover:bg-[#252b5c] transition-colors disabled:opacity-50">
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LabelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border-2 font-medium transition-colors ${
        active ? "bg-[#FFED00] border-[#FFED00] text-[#1A1E3C] font-bold" : "bg-white border-[#1A1E3C] text-[#1A1E3C] hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

const inp = "w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] bg-white transition-colors";
