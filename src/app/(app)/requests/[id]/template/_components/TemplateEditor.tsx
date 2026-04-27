"use client";

import { useState } from "react";

interface Props {
  emailTemplate: string;
  slackTemplate: string;
}

type Tab = "email" | "slack";

export default function TemplateEditor({ emailTemplate, slackTemplate }: Props) {
  const [tab, setTab] = useState<Tab>("email");
  const [emailText, setEmailText] = useState(emailTemplate);
  const [slackText, setSlackText] = useState(slackTemplate);
  const [copied, setCopied] = useState(false);

  const current = tab === "email" ? emailText : slackText;
  const setCurrent = tab === "email" ? setEmailText : setSlackText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current);
    } catch {
      const el = document.createElement("textarea");
      el.value = current;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = current.split("\n").length;

  return (
    <div className="space-y-4">
      {/* タブ */}
      <div className="flex gap-0 border-2 border-[#1A1E3C] rounded-xl overflow-hidden w-fit">
        {(["email", "slack"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-sm font-bold transition-colors ${
              tab === t
                ? "bg-[#FFED00] text-[#1A1E3C]"
                : "bg-white text-gray-400 hover:text-[#1A1E3C]"
            }`}
          >
            {t === "email" ? "メール" : "Slack"}
          </button>
        ))}
      </div>

      {/* エディタ */}
      <div className="bg-white rounded-2xl border-2 border-[#1A1E3C] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500 font-medium">
            {tab === "email" ? "メール文面" : "Slack文面"}
          </span>
          <span className="text-xs text-gray-400">{lineCount} 行</span>
        </div>
        <textarea
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          rows={Math.max(lineCount + 2, 18)}
          className="w-full px-4 py-3 text-sm leading-relaxed font-mono focus:outline-none resize-y"
          spellCheck={false}
        />
      </div>

      {/* コピーボタン */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCopy}
          className={`px-6 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
            copied
              ? "bg-green-500 border-green-500 text-white"
              : "bg-[#1A1E3C] border-[#1A1E3C] text-[#FFED00] hover:bg-[#252b5c]"
          }`}
        >
          {copied ? "✓ コピーしました" : "クリップボードにコピー"}
        </button>
        <p className="text-xs text-gray-400">
          ［　］の箇所は未入力の項目です。直接編集して埋めてください。
        </p>
      </div>
    </div>
  );
}
