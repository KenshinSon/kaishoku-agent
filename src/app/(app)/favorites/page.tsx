import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FavoriteList from "./_components/FavoriteList";
import type { FavoriteItem } from "./_components/FavoriteList";

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  const raw = await prisma.favorite.findMany({
    where: { userId: session!.user.id },
    include: {
      venue: {
        select: { id: true, name: true, address: true, rating: true, priceLevel: true, googleMapsUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items: FavoriteItem[] = raw.map((f) => ({
    id: f.id,
    memo: f.memo,
    createdAt: f.createdAt.toISOString(),
    venue: f.venue,
  }));

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">Favorites</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">お気に入り</h1>
        <p className="text-sm text-[#1A1E3C]/70 mt-1">
          お気に入りの店 {items.length}件
        </p>
      </div>

      <FavoriteList initialItems={items} />
    </div>
  );
}
