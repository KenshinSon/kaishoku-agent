"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="text-gray-400 hover:text-gray-700 transition-colors"
    >
      ログアウト
    </button>
  );
}
