import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "./_components/SignOutButton";
import NavBar from "./_components/NavBar";
import FloatingChat from "./_components/FloatingChat";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-white">
      <header>
        {/* 上段: ロゴ + ユーザー情報 */}
        <div className="bg-[#FFED00]">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/dashboard">
              <img src="/logo.png" alt="ビジめし" style={{ height: "40px", width: "auto" }} />
            </Link>
            <div className="flex items-center gap-5 text-sm text-[#1A1E3C]">
              <span className="font-medium">{session.user.name}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
        {/* 下段: ナビゲーション */}
        <NavBar />
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <FloatingChat />
    </div>
  );
}
