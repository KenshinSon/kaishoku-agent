"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import VenueSuggestionCards from "@/app/(app)/_components/VenueSuggestionCards";
import type { VenueSuggestion } from "@/lib/chat-parser";

type MessageMetadata = {
  type: "venue_suggestion";
  requestId: string;
  venues: VenueSuggestion[];
} | null;

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: MessageMetadata;
};

type Session = { id: string; title: string | null; updatedAt: string; messages: Message[] };

const WELCOME_MESSAGE = "こんにちは！会食のお店探しをお手伝いします。どんな会食をお考えですか？";

export default function ChatClient({
  initialSessions,
  initialQuery,
}: {
  initialSessions: Session[];
  initialQuery?: string;
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const doSend = useCallback(async (text: string, currentActiveId: string | null) => {
    const optimisticMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: currentActiveId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setActiveId(data.sessionId);

      const aiMsg: Message = {
        id: `tmp-ai-${Date.now()}`,
        role: "assistant",
        content: data.message,
        createdAt: new Date().toISOString(),
        metadata: data.type === "venue_suggestion"
          ? { type: "venue_suggestion", requestId: data.requestId, venues: data.venues }
          : null,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (!currentActiveId) {
        const sessionsRes = await fetch("/api/chat/sessions");
        setSessions(await sessionsRes.json());
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery?.trim() && !autoSentRef.current) {
      autoSentRef.current = true;
      doSend(initialQuery.trim(), null);
    }
  }, [initialQuery, doSend]);

  const loadSession = useCallback(async (id: string) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      const data = await res.json();
      // metadata は Prisma から { type, requestId, venues } オブジェクトで返る
      const msgs: Message[] = (data.messages ?? []).map((m: Message & { metadata: unknown }) => ({
        ...m,
        metadata: m.metadata && typeof m.metadata === "object" && "type" in (m.metadata as object)
          ? m.metadata as MessageMetadata
          : null,
      }));
      setMessages(msgs);
      setActiveId(id);
    } finally {
      setLoadingSession(false);
      inputRef.current?.focus();
    }
  }, []);

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const send = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    doSend(text, activeId);
  };

  const deleteSession = async (id: string) => {
    if (!window.confirm("この会話を削除しますか？")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeId === id) startNewChat();
    } finally {
      setDeletingId(null);
    }
  };

  const isNewChat = !activeId;

  return (
    <div className="flex h-[calc(100vh-160px)] -mx-6 -mt-8">
      {/* サイドバー */}
      <div className="w-64 bg-[#1A1E3C] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 bg-[#FFED00] text-[#1A1E3C] font-bold text-sm rounded-xl hover:bg-[#ffe000] transition-colors"
          >
            + 新規チャット
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <p className="text-white/40 text-xs text-center py-6 px-4">まだ会話がありません</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                  activeId === s.id ? "bg-white/15" : "hover:bg-white/10"
                }`}
                onClick={() => loadSession(s.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{s.title ?? "新しい会話"}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {new Date(s.updatedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  disabled={deletingId === s.id}
                  className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 text-xs transition-all shrink-0"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-[#FFED00] px-6 py-4 shrink-0">
          <h1 className="text-xl font-black text-[#1A1E3C]">
            {isNewChat ? "新しい会話" : sessions.find((s) => s.id === activeId)?.title ?? "会話"}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingSession ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 bg-[#1A1E3C] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {isNewChat && messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] px-4 py-3 bg-white border border-[#1A1E3C] rounded-2xl text-sm text-gray-800 leading-relaxed">
                    {WELCOME_MESSAGE}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id ?? i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-[#FFED00] text-[#1A1E3C] font-medium">
                      {msg.content}
                      <p className="text-xs mt-1.5 text-[#1A1E3C]/50">
                        {new Date(msg.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-[75%] space-y-1">
                      {msg.content && (
                        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-white border border-[#1A1E3C] text-gray-800">
                          {msg.content}
                          <p className="text-xs mt-1.5 text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                      {msg.metadata?.type === "venue_suggestion" && (
                        <VenueSuggestionCards
                          venues={msg.metadata.venues}
                          requestId={msg.metadata.requestId}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#1A1E3C] rounded-2xl px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-[#1A1E3C] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="例：渋谷で接待向け和食、4名、予算1.5万円"
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] transition-colors disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-[#FFED00] border-2 border-[#1A1E3C] text-[#1A1E3C] font-bold rounded-xl text-sm hover:bg-[#ffe000] transition-colors disabled:opacity-40 shrink-0"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
