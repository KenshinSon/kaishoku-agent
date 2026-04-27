"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatInput() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    router.push(`/chat?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="例：銀座で接待向け和食、4名、予算1.5万円"
        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFED00] transition-colors"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className="px-5 py-3 bg-[#FFED00] text-[#1A1E3C] font-bold rounded-xl text-sm hover:bg-[#ffe000] transition-colors disabled:opacity-40 shrink-0"
      >
        送信
      </button>
    </div>
  );
}
