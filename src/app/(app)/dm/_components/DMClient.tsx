"use client";

import { useState, useEffect, useRef } from "react";

type OtherUser = { id: string; name: string | null; image: string | null; isPublicProfile: boolean };
type LastMessage = { id: string; content: string; createdAt: string; senderId: string; readAt: string | null } | null;
type Conversation = { id: string; otherUser: OtherUser; lastMessage: LastMessage; unreadCount: number };
type Message = { id: string; conversationId: string; senderId: string; content: string; createdAt: string; sender: { id: string; name: string | null; image: string | null } };

export default function DMClient({
  conversations: initialConvs,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  const [convs, setConvs] = useState(initialConvs);
  const [selectedId, setSelectedId] = useState<string | null>(initialConvs[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMsgs(true);
    fetch(`/api/dm/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        setConvs((prev) => prev.map((c) => c.id === selectedId ? { ...c, unreadCount: 0 } : c));
      })
      .finally(() => setLoadingMsgs(false));
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/dm/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) return;
      const msg: Message = await res.json();
      setMessages((prev) => [...prev, msg]);
      setConvs((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt, senderId: msg.senderId, readAt: null } }
            : c
        )
      );
    } finally {
      setSending(false);
    }
  };

  const selectedConv = convs.find((c) => c.id === selectedId);

  return (
    <div className="flex gap-0 border-2 border-[#1A1E3C] rounded-2xl overflow-hidden" style={{ height: "70vh" }}>
      {/* 左サイドバー */}
      <div className="w-72 border-r-2 border-[#1A1E3C] flex flex-col shrink-0">
        <div className="px-4 py-3 bg-[#1A1E3C]">
          <p className="text-white font-black text-sm">会話一覧</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-10 px-4">
              まだDMはありません
            </p>
          )}
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                selectedId === c.id ? "bg-[#FFFBE0]" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#1A1E3C] text-sm truncate">
                  {c.otherUser.name ?? "名前なし"}
                </p>
                {c.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-[#FFED00] text-[#1A1E3C] text-xs font-black rounded-full flex items-center justify-center shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </div>
              {c.lastMessage && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage.content}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 右メインエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            会話を選択してください
          </div>
        ) : (
          <>
            {/* ヘッダー */}
            <div className="px-5 py-3 border-b-2 border-[#1A1E3C] bg-white shrink-0">
              <p className="font-black text-[#1A1E3C]">{selectedConv.otherUser.name ?? "名前なし"}</p>
            </div>

            {/* メッセージ一覧 */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F8F7F4]">
              {loadingMsgs && (
                <p className="text-center text-xs text-gray-400">読み込み中...</p>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                const d = new Date(msg.createdAt);
                const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] space-y-1`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? "bg-[#1A1E3C] text-white rounded-br-sm"
                            : "bg-white border-2 border-[#1A1E3C] text-[#1A1E3C] rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className={`text-xs text-gray-400 ${isMine ? "text-right" : "text-left"}`}>{time}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* 入力エリア */}
            <div className="px-4 py-3 border-t-2 border-[#1A1E3C] bg-white shrink-0 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A1E3C] transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-5 py-2.5 bg-[#1A1E3C] text-[#FFED00] font-bold rounded-xl text-sm hover:bg-[#252b5c] transition-colors disabled:opacity-40 shrink-0"
                >
                  送信
                </button>
              </div>
              <button
                onClick={() => alert("準備中です")}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-[#1A1E3C] hover:text-[#1A1E3C] transition-colors"
              >
                🎫 ポイントを消費して予約代行チケットと交換
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
