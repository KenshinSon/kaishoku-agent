"use client";

import { useSession, signOut } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-3xl font-bold">ビジめし</h1>
      <p className="text-gray-500">AIが最適な会食先を提案します</p>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-700">
            ようこそ、<span className="font-semibold">{session.user.name}</span> さん
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <a
          href="/auth/signin"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          ログインして始める
        </a>
      )}
    </main>
  );
}
