"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "条件から探す", href: "/requests/new" },
  { label: "チャットで探す", href: "/chat" },
  { label: "口コミ", href: "/reviews" },
  { label: "DM", href: "/dm" },
  { label: "予約", href: "/bookings" },
  { label: "検索条件", href: "/search-conditions" },
  { label: "履歴", href: "/history" },
  { label: "お気に入り", href: "/favorites" },
  { label: "アカウント", href: "/settings" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/requests/new") return pathname === "/requests/new";
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-[#1A1E3C]">
      <div className="max-w-6xl mx-auto px-6 flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-3 text-sm transition-colors ${
              isActive(item.href)
                ? "bg-[#FFED00] text-[#1A1E3C] font-bold"
                : "text-white font-medium hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
