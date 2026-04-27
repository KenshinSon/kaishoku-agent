import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HistoryList from "./_components/HistoryList";
import type { HistoryItem } from "./_components/HistoryList";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { status } = await searchParams;

  const requests = await prisma.diningRequest.findMany({
    where: { userId: session!.user.id, NOT: { status: "TEMPLATE" } },
    include: {
      contact: true,
      recommendations: {
        where: { status: "ACTIVE" },
        include: {
          venues: {
            where: { isSelected: true },
            include: { venue: { select: { name: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items: HistoryItem[] = requests.map((req) => ({
    id: req.id,
    status: req.status,
    scheduledAt: req.scheduledAt?.toISOString() ?? null,
    totalGuests: req.totalGuests,
    purpose: req.purpose,
    budgetPerPerson: req.budgetPerPerson,
    createdAt: req.createdAt.toISOString(),
    contact: req.contact
      ? { name: req.contact.name, title: req.contact.title, companyName: req.contact.companyName }
      : null,
    selectedVenueName: req.recommendations[0]?.venues[0]?.venue.name ?? null,
  }));

  const validFilters = ["all", "DRAFT", "PROPOSED", "CONFIRMED", "COMPLETED", "CANCELLED"];
  const initialFilter = status && validFilters.includes(status) ? status : "all";

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">History</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">履歴</h1>
        <p className="text-sm text-[#1A1E3C]/70 mt-1">過去の会食依頼 {items.length}件</p>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center text-gray-400">
          まだ会食履歴がありません
        </div>
      ) : (
        <HistoryList items={items} initialFilter={initialFilter} />
      )}
    </div>
  );
}
