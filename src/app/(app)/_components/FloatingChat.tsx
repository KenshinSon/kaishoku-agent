"use client";

import { useState, useRef, useEffect } from "react";
import VenueSuggestionCards from "./VenueSuggestionCards";
import type { VenueSuggestion } from "@/lib/chat-parser";

type UserMsg = { role: "user"; content: string };
type AssistantMsg = {
  role: "assistant";
  content: string;
  type?: "venue_suggestion" | "text";
  requestId?: string;
  venues?: VenueSuggestion[];
};
type Message = UserMsg | AssistantMsg;

const WELCOME: Message = {
  role: "assistant",
  content: "こんにちは！会食のお店探しをお手伝いします。どんな会食をお考えですか？",
};

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionId(data.sessionId);

      const assistantMsg: AssistantMsg = {
        role: "assistant",
        content: data.message,
        type: data.type,
        requestId: data.requestId,
        venues: data.venues,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "エラーが発生しました。もう一度お試しください。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[400px] h-[540px] bg-white rounded-2xl border-2 border-[#1A1E3C] shadow-2xl flex flex-col overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-[#1A1E3C] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#FFED00] rounded-full" />
              <span className="text-white font-bold text-sm">ビジめしAI</span>
            </div>
            <div className="flex items-center gap-2">
              <a href="/chat" className="text-white/60 hover:text-white text-xs transition-colors">
                全画面 →
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-[#FFED00] text-[#1A1E3C] font-medium">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[92%] space-y-1">
                    {msg.content && (
                      <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-white border border-[#1A1E3C] text-gray-800">
                        {msg.content}
                      </div>
                    )}
                    {msg.type === "venue_suggestion" && msg.venues && msg.requestId && (
                      <VenueSuggestionCards venues={msg.venues} requestId={msg.requestId} />
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#1A1E3C] rounded-2xl px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-[#1A1E3C] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 入力エリア */}
          <div className="px-3 py-3 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="メッセージを入力..."
              disabled={loading}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] transition-colors disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-xl text-sm hover:bg-[#ffe000] transition-colors disabled:opacity-40 shrink-0"
            >
              送信
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#FFED00] border-2 border-[#1A1E3C] rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="チャットを開く"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="#1A1E3C"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
