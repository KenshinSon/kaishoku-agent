"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PURPOSE_OPTIONS = ["初回顔合わせ", "関係構築", "受注獲得", "クロージング", "御礼", "採用アトラクト"];
const CUISINE_OPTIONS = ["和食", "海鮮", "寿司", "焼鳥", "肉", "中華", "イタリアン"];
const DRINK_OPTIONS = ["日本酒", "ワイン", "ビール", "焼酎", "ノンアル"];
const ATMOSPHERE_OPTIONS = ["静かめ", "ほどよく落ち着き", "賑やか"];
const PRIVATE_ROOM_OPTIONS = ["個室必須", "半個室可", "こだわらない"];
const SMOKING_OPTIONS = ["禁煙のみ", "分煙可", "喫煙可"];
const TRANSPORT_OPTIONS = ["電車", "タクシー", "徒歩"];
const LOCATION_PRIORITY_OPTIONS = ["公平性優先", "相手最優先", "自社最優先"];

export type FormState = {
  date: string; time: string; timeFlexible: boolean;
  totalGuests: string; clientGuests: string; ownGuests: string;
  companyName: string; contactName: string; contactTitle: string;
  purpose: string; relationshipNote: string;
  cuisinePrefs: string[]; drinkPrefs: string[];
  budgetPerPerson: string; budgetDrinkIncluded: boolean;
  atmosphereNote: string; privateRoom: string;
  foodLikes: string; foodDislikes: string; foodAbsoluteNg: string;
  smokingPolicy: string;
  guestDepartureLocation: string; guestReturnStation: string; ownerDepartureLocation: string;
  transportMode: string; locationPriority: string; preferredArea: string; ngConditions: string;
};

const baseForm: FormState = {
  date: "", time: "", timeFlexible: false,
  totalGuests: "", clientGuests: "", ownGuests: "",
  companyName: "", contactName: "", contactTitle: "",
  purpose: "", relationshipNote: "",
  cuisinePrefs: [], drinkPrefs: [],
  budgetPerPerson: "", budgetDrinkIncluded: false,
  atmosphereNote: "", privateRoom: "",
  foodLikes: "", foodDislikes: "", foodAbsoluteNg: "",
  smokingPolicy: "",
  guestDepartureLocation: "", guestReturnStation: "", ownerDepartureLocation: "",
  transportMode: "", locationPriority: "", preferredArea: "", ngConditions: "",
};

const STEP_LABELS = ["基本情報", "食の好み", "場所"];

export default function NewRequestForm({ initialValues }: { initialValues?: Partial<FormState> }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({ ...baseForm, ...initialValues });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleArray = (key: "cuisinePrefs" | "drinkPrefs", value: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const createRes = await fetch("/api/dining-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ngConditions: form.ngConditions ? form.ngConditions.split("\n").filter(Boolean) : [],
        }),
      });
      if (!createRes.ok) throw new Error("依頼の作成に失敗しました");
      const diningReq = await createRes.json();
      await fetch(`/api/dining-requests/${diningReq.id}/recommend`, { method: "POST" });
      router.push(`/requests/${diningReq.id}/recommendations`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "エラーが発生しました");
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-[#FFED00] z-50 flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-black text-[#1A1E3C]">AIが最適なお店を探しています</h2>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-[#1A1E3C] animate-bounce"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <p className="text-sm text-[#1A1E3C]/70">Google Places → スコアリング → AI分析中</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-[#1A1E3C]">
          ← 戻る
        </button>
      </div>
      <h1 className="text-2xl font-black text-[#1A1E3C]">新しい会食を依頼する</h1>

      <StepIndicator current={step} />

      {step === 1 && <Step1 form={form} set={set} toggleArray={toggleArray} />}
      {step === 2 && <Step2 form={form} set={set} toggleArray={toggleArray} />}
      {step === 3 && <Step3 form={form} set={set} />}

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{submitError}</p>
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="px-6 py-3 rounded-xl border-2 border-[#1A1E3C] text-[#1A1E3C] text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            ← 戻る
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            className="flex-1 py-4 rounded-2xl bg-[#1A1E3C] text-[#FFED00] text-lg font-bold hover:bg-[#252b5c] transition-colors"
          >
            次へ →
          </button>
        ) : (
          <button
            onClick={handleFinalSubmit}
            className="flex-1 py-4 rounded-2xl bg-[#1A1E3C] text-[#FFED00] text-lg font-bold hover:bg-[#252b5c] transition-colors"
          >
            AIに提案してもらう
          </button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-2">
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        const done = s < current;
        const active = s === current;
        return (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                active ? "bg-[#FFED00] text-[#1A1E3C]"
                : done ? "bg-[#1A1E3C] text-white"
                : "bg-gray-200 text-gray-400"
              }`}>
                {done ? "✓" : s}
              </div>
              <span className={`text-sm font-medium hidden sm:block transition-colors ${
                active ? "text-[#1A1E3C]" : done ? "text-gray-500" : "text-gray-300"
              }`}>
                {label}
              </span>
            </div>
            {s < 3 && (
              <div className={`w-6 h-0.5 mx-2 shrink-0 ${s < current ? "bg-[#1A1E3C]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ form, set, toggleArray }: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleArray: (key: "cuisinePrefs" | "drinkPrefs", value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card title="日時・人数">
        <div className="grid grid-cols-2 gap-4">
          <Field label="日付">
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inp} />
          </Field>
          <Field label="時間">
            <input type="time" value={form.time} disabled={form.timeFlexible} onChange={(e) => set("time", e.target.value)} className={inp} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={form.timeFlexible} onChange={(e) => set("timeFlexible", e.target.checked)} className="rounded" />
          日時は応相談（フレキシブル）
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Field label="合計人数">
            <input type="number" min="1" value={form.totalGuests} onChange={(e) => set("totalGuests", e.target.value)} placeholder="4" className={inp} />
          </Field>
          <Field label="相手先（名）">
            <input type="number" min="0" value={form.clientGuests} onChange={(e) => set("clientGuests", e.target.value)} placeholder="2" className={inp} />
          </Field>
          <Field label="自社（名）">
            <input type="number" min="0" value={form.ownGuests} onChange={(e) => set("ownGuests", e.target.value)} placeholder="2" className={inp} />
          </Field>
        </div>
      </Card>

      <Card title="相手先情報">
        <Field label="企業名">
          <input type="text" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="株式会社〇〇" className={inp} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="担当者名">
            <input type="text" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="山田 太郎" className={inp} />
          </Field>
          <Field label="役職">
            <input type="text" value={form.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} placeholder="部長" className={inp} />
          </Field>
        </div>
      </Card>

      <Card title="会食の目的">
        <Field label="目的">
          <div className="flex flex-wrap gap-2">
            {PURPOSE_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.purpose === opt} onClick={() => set("purpose", form.purpose === opt ? "" : opt)} />
            ))}
          </div>
        </Field>
        <Field label="関係性・背景（任意）">
          <textarea value={form.relationshipNote} onChange={(e) => set("relationshipNote", e.target.value)} rows={2} placeholder="例：先月初めてお会いした方で、今回は関係深化が目的です" className={inp} />
        </Field>
      </Card>
    </div>
  );
}

function Step2({ form, set, toggleArray }: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleArray: (key: "cuisinePrefs" | "drinkPrefs", value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card title="料理・ドリンク">
        <Field label="料理ジャンル（複数選択可）">
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.cuisinePrefs.includes(opt)} onClick={() => toggleArray("cuisinePrefs", opt)} />
            ))}
          </div>
        </Field>
        <Field label="ドリンク（複数選択可）">
          <div className="flex flex-wrap gap-2">
            {DRINK_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.drinkPrefs.includes(opt)} onClick={() => toggleArray("drinkPrefs", opt)} />
            ))}
          </div>
        </Field>
        <Field label="食の好み（任意）">
          <input type="text" value={form.foodLikes} onChange={(e) => set("foodLikes", e.target.value)} placeholder="例：魚介類が好き、和食が得意" className={inp} />
        </Field>
        <Field label="避けたいもの（任意）">
          <input type="text" value={form.foodDislikes} onChange={(e) => set("foodDislikes", e.target.value)} placeholder="例：辛いもの、生もの" className={inp} />
        </Field>
        <Field label="絶対NG（任意）">
          <input type="text" value={form.foodAbsoluteNg} onChange={(e) => set("foodAbsoluteNg", e.target.value)} placeholder="例：アレルギー・宗教上の理由" className={inp} />
        </Field>
      </Card>

      <Card title="予算">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Field label="1人あたり予算（円）">
              <input type="number" value={form.budgetPerPerson} onChange={(e) => set("budgetPerPerson", e.target.value)} placeholder="15000" className={inp} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-2">
            <input type="checkbox" checked={form.budgetDrinkIncluded} onChange={(e) => set("budgetDrinkIncluded", e.target.checked)} className="rounded" />
            ドリンク込み
          </label>
        </div>
      </Card>

      <Card title="雰囲気・席・喫煙">
        <Field label="雰囲気">
          <div className="flex flex-wrap gap-2">
            {ATMOSPHERE_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.atmosphereNote === opt} onClick={() => set("atmosphereNote", form.atmosphereNote === opt ? "" : opt)} />
            ))}
          </div>
        </Field>
        <Field label="個室">
          <div className="flex flex-wrap gap-2">
            {PRIVATE_ROOM_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.privateRoom === opt} onClick={() => set("privateRoom", form.privateRoom === opt ? "" : opt)} />
            ))}
          </div>
        </Field>
        <Field label="喫煙">
          <div className="flex flex-wrap gap-2">
            {SMOKING_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.smokingPolicy === opt} onClick={() => set("smokingPolicy", form.smokingPolicy === opt ? "" : opt)} />
            ))}
          </div>
        </Field>
      </Card>
    </div>
  );
}

function Step3({ form, set }: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Card title="アクセス">
        <Field label="相手の出発地">
          <input type="text" value={form.guestDepartureLocation} onChange={(e) => set("guestDepartureLocation", e.target.value)} placeholder="例：渋谷" className={inp} />
        </Field>
        <Field label="相手の帰宅先駅">
          <input type="text" value={form.guestReturnStation} onChange={(e) => set("guestReturnStation", e.target.value)} placeholder="例：新宿駅" className={inp} />
        </Field>
        <Field label="自分の出発地">
          <input type="text" value={form.ownerDepartureLocation} onChange={(e) => set("ownerDepartureLocation", e.target.value)} placeholder="例：品川（未入力時は代々木/中目黒/世田谷を基準）" className={inp} />
        </Field>
      </Card>

      <Card title="移動・エリア">
        <Field label="移動手段">
          <div className="flex flex-wrap gap-2">
            {TRANSPORT_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.transportMode === opt} onClick={() => set("transportMode", form.transportMode === opt ? "" : opt)} />
            ))}
          </div>
        </Field>
        <Field label="立地優先">
          <div className="flex flex-wrap gap-2">
            {LOCATION_PRIORITY_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={form.locationPriority === opt} onClick={() => set("locationPriority", form.locationPriority === opt ? "" : opt)} />
            ))}
          </div>
        </Field>
        <Field label="希望エリア（任意）">
          <input type="text" value={form.preferredArea} onChange={(e) => set("preferredArea", e.target.value)} placeholder="例：銀座・六本木・丸の内" className={inp} />
        </Field>
      </Card>

      <Card title="NG条件・備考（任意）">
        <Field label="NG条件（1行ごとに入力）">
          <textarea value={form.ngConditions} onChange={(e) => set("ngConditions", e.target.value)} rows={3} placeholder={"チェーン店はNG\n喫煙可の店はNG"} className={inp} />
        </Field>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-4">
      <h2 className="font-bold text-[#1A1E3C]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
      className={`px-3.5 py-1.5 rounded-full text-sm border-2 font-medium transition-colors ${
        active
          ? "bg-[#FFED00] border-[#FFED00] text-[#1A1E3C] font-bold"
          : "bg-white border-[#1A1E3C] text-[#1A1E3C] hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

const inp = "w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] bg-white transition-colors";
