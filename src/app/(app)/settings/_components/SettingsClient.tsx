"use client";

import { useState } from "react";

const INDUSTRY_OPTIONS = ["IT・テクノロジー", "コンサルティング", "金融・保険", "商社・流通", "メーカー", "不動産", "医療・ヘルスケア", "その他"];

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  kaishoku_master: { emoji: "🏆", label: "会食マスター" },
  washoku_expert:  { emoji: "🍣", label: "和食通" },
  settai_master:   { emoji: "🤝", label: "接待の達人" },
};

const POINT_REASON_LABEL: Record<string, string> = {
  review_post:     "口コミ投稿",
  helpful_vote:    "役に立った票を獲得",
  ticket_exchange: "予約代行チケット交換",
};

type Tab = "profile" | "company" | "plan";

export type UserData = {
  name: string | null;
  email: string | null;
  mobile: string | null;
  ownerDepartureLocation: string | null;
  bio: string | null;
  isPublicProfile: boolean;
  dmEnabled: boolean;
};

export type OrgData = {
  id: string | null;
  name: string;
  address: string | null;
  industry: string | null;
  nearestStation: string | null;
  websiteUrl: string | null;
};

export type PointsData = {
  points: number;
  totalEarned: number;
  badges: string[];
  history: { id: string; points: number; reason: string; createdAt: string }[];
};

export default function SettingsClient({ user, org, points, initialTab }: { user: UserData; org: OrgData; points: PointsData; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "profile");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "profile", label: "プロフィール" },
    { key: "company", label: "自社情報" },
    { key: "plan", label: "プラン" },
  ];

  return (
    <>
      <div className="flex gap-0 border-2 border-[#1A1E3C] rounded-xl overflow-hidden w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[#1A1E3C] text-white font-bold"
                : "bg-white text-[#1A1E3C] hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} points={points} showToast={showToast} />}
      {tab === "company" && <CompanyTab org={org} showToast={showToast} />}
      {tab === "plan" && <PlanTab points={points} showToast={showToast} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1E3C] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

function ProfileTab({ user, points, showToast }: { user: UserData; points: PointsData; showToast: (msg: string) => void }) {
  const [name, setName] = useState(user.name ?? "");
  const [mobile, setMobile] = useState(user.mobile ?? "");
  const [ownerDepartureLocation, setOwnerDepartureLocation] = useState(user.ownerDepartureLocation ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [isPublicProfile, setIsPublicProfile] = useState(user.isPublicProfile);
  const [dmEnabled, setDmEnabled] = useState(user.dmEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, ownerDepartureLocation, bio, isPublicProfile, dmEnabled }),
      });
      if (!res.ok) throw new Error();
      showToast("✓ プロフィールを保存しました");
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ポイント */}
      <div className="bg-[#FFED00] border-2 border-[#1A1E3C] rounded-2xl p-5">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">保有ポイント</p>
        <p className="text-5xl font-black text-[#1A1E3C]">{points.points.toLocaleString()}<span className="text-xl ml-1">pt</span></p>
        <p className="text-xs text-[#1A1E3C]/60 mt-1">累計獲得: {points.totalEarned.toLocaleString()}pt</p>
      </div>

      {/* バッジ */}
      {points.badges.length > 0 && (
        <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-[#1A1E3C] text-sm">獲得バッジ</h3>
          <div className="flex flex-wrap gap-2">
            {points.badges.map((b) => {
              const meta = BADGE_META[b] ?? { emoji: "🏅", label: b };
              return (
                <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1E3C] text-white text-sm font-bold rounded-xl">
                  {meta.emoji} {meta.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ポイント履歴 */}
      {points.history.length > 0 && (
        <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-[#1A1E3C] text-sm">ポイント履歴（直近10件）</h3>
          <div className="space-y-2">
            {points.history.map((h) => {
              const d = new Date(h.createdAt);
              const date = `${d.getMonth() + 1}/${d.getDate()}`;
              return (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-600">{POINT_REASON_LABEL[h.reason] ?? h.reason}</span>
                    <span className="text-xs text-gray-400 ml-2">{date}</span>
                  </div>
                  <span className={`font-bold ${h.points > 0 ? "text-green-600" : "text-red-500"}`}>
                    {h.points > 0 ? `+${h.points}` : h.points}pt
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* プロフィール編集 */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-5">
        <h2 className="font-black text-[#1A1E3C] text-base">プロフィール</h2>

        <Field label="氏名">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" className={inp} />
        </Field>

        <Field label="メールアドレス">
          <input type="email" value={user.email ?? ""} readOnly disabled className={`${inp} bg-gray-50 text-gray-400 cursor-not-allowed`} />
          <p className="text-xs text-gray-400 mt-1">Googleアカウントと連携しているため変更できません</p>
        </Field>

        <Field label="携帯番号">
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="090-0000-0000" className={inp} />
          <p className="text-xs text-gray-400 mt-1">確定連絡テンプレートに自動挿入されます</p>
        </Field>

        <Field label="勤務地・最寄駅">
          <input type="text" value={ownerDepartureLocation} onChange={(e) => setOwnerDepartureLocation(e.target.value)} placeholder="例：品川・渋谷" className={inp} />
          <p className="text-xs text-gray-400 mt-1">会食場所の提案時にデフォルトの出発地として使用されます</p>
        </Field>

        <Field label="自己紹介・備考（任意）">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="例：IT業界10年。接待は個室を好みます。" className={inp} />
        </Field>

        {/* 公開設定 */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-bold text-[#1A1E3C]">公開設定</h3>
          <Toggle
            label="プロフィールを公開する"
            description="口コミに名前が表示されます"
            checked={isPublicProfile}
            onChange={setIsPublicProfile}
          />
          <Toggle
            label="DMを受け付ける"
            description="公開すると他のユーザーからDMを受け取れます"
            checked={dmEnabled}
            onChange={(v) => {
              setDmEnabled(v);
              if (v && !isPublicProfile) setIsPublicProfile(true);
            }}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-[#1A1E3C] text-[#FFED00] font-bold rounded-xl text-sm hover:bg-[#252b5c] transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}

function CompanyTab({ org, showToast }: { org: OrgData; showToast: (msg: string) => void }) {
  const [name, setName] = useState(org.name ?? "");
  const [address, setAddress] = useState(org.address ?? "");
  const [industry, setIndustry] = useState(org.industry ?? "");
  const [nearestStation, setNearestStation] = useState(org.nearestStation ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(org.websiteUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/organizations/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, industry, nearestStation, websiteUrl }),
      });
      if (!res.ok) throw new Error();
      showToast("✓ 自社情報を保存しました");
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-5">
      <h2 className="font-black text-[#1A1E3C] text-base">自社情報</h2>

      <Field label="会社名">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="株式会社〇〇" className={inp} />
      </Field>

      <Field label="会社の住所">
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="東京都渋谷区〇〇1-2-3" className={inp} />
      </Field>

      <Field label="業種">
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inp}>
          <option value="">選択してください</option>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </Field>

      <Field label="会社の最寄駅">
        <input type="text" value={nearestStation} onChange={(e) => setNearestStation(e.target.value)} placeholder="例：渋谷駅・恵比寿駅" className={inp} />
      </Field>

      <Field label="会社のWebサイト">
        <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.co.jp" className={inp} />
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-[#1A1E3C] text-[#FFED00] font-bold rounded-xl text-sm hover:bg-[#252b5c] transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}

function PlanTab({ points, showToast }: { points: PointsData; showToast: (msg: string) => void }) {
  const [exchanging, setExchanging] = useState(false);
  const [localPoints, setLocalPoints] = useState(points.points);

  const handleExchange = async () => {
    if (localPoints < 500) return;
    setExchanging(true);
    try {
      const res = await fetch("/api/points/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reservation_ticket" }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "交換に失敗しました");
        return;
      }
      setLocalPoints((p) => p - 500);
      showToast("✓ 予約代行チケット1回分を取得しました");
    } finally {
      setExchanging(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ポイント交換 */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-4">
        <h3 className="font-black text-[#1A1E3C] text-base">ポイント交換</h3>
        <div className="flex items-center justify-between p-4 bg-[#F8F7F4] rounded-xl">
          <div>
            <p className="font-bold text-[#1A1E3C]">🎫 予約代行チケット 1回</p>
            <p className="text-xs text-gray-500 mt-0.5">電話での予約を代行します</p>
          </div>
          <p className="font-black text-[#1A1E3C] text-xl">500pt</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">現在のポイント: <span className="font-black text-[#1A1E3C]">{localPoints.toLocaleString()}pt</span></p>
          <button
            onClick={handleExchange}
            disabled={localPoints < 500 || exchanging}
            className="px-5 py-2.5 bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-xl text-sm hover:bg-[#ffe000] transition-colors disabled:opacity-40"
          >
            {exchanging ? "処理中..." : "交換する"}
          </button>
        </div>
        {localPoints < 500 && (
          <p className="text-xs text-gray-400">口コミを投稿してポイントを貯めましょう（投稿 +10pt）</p>
        )}
      </div>

      {/* 無料プラン */}
      <div className="bg-white border-2 border-[#1A1E3C] rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#1A1E3C] text-base">無料プラン</h3>
          <span className="px-3 py-1 bg-[#1A1E3C] text-[#FFED00] text-xs font-bold rounded-full">現在のプラン</span>
        </div>
        <p className="text-sm text-gray-600">基本機能をすべて利用できます。</p>
        <ul className="space-y-2 text-sm text-gray-600">
          {["会食依頼の作成・管理", "AIによるお店の提案", "確定連絡テンプレート生成", "検索条件の保存", "お気に入り店舗の管理"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-[#1A1E3C] font-bold">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* プレミアムプラン */}
      <div className="bg-white border-2 border-[#FFED00] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-[#1A1E3C] text-base">プレミアムプラン</h3>
              <span className="px-2.5 py-0.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-full">COMING SOON</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">月額 ¥980（税込）</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          {["予約代行（電話での予約を代行）", "優先サポート", "会食ナレッジDB（チーム共有）", "無制限の提案回数"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-[#FFED00] bg-[#1A1E3C] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <button
          onClick={() => showToast("準備中です。リリース時にお知らせします。")}
          className="w-full py-3 bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-xl text-sm hover:bg-[#ffe000] transition-colors"
        >
          プレミアムにアップグレード
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#1A1E3C]">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors ${
          checked ? "bg-[#1A1E3C] border-[#1A1E3C]" : "bg-gray-200 border-gray-200"
        }`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
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

const inp = "w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] bg-white transition-colors";
