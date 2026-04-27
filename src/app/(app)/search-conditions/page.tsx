import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TemplateManager from "./_components/TemplateManager";
import type { TemplateItem } from "./_components/TemplateManager";

export default async function SearchConditionsPage() {
  const session = await getServerSession(authOptions);

  const raw = await prisma.diningRequest.findMany({
    where: { userId: session!.user.id, status: "TEMPLATE" },
    orderBy: { createdAt: "desc" },
  });

  const templates: TemplateItem[] = raw.map((t) => ({
    id: t.id,
    templateName: t.templateName,
    preferredArea: t.preferredArea,
    budgetPerPerson: t.budgetPerPerson,
    totalGuests: t.totalGuests,
    cuisinePrefs: t.cuisinePrefs,
    drinkPrefs: t.drinkPrefs,
    atmosphereNote: t.atmosphereNote,
    privateRoom: t.privateRoom,
    smokingPolicy: t.smokingPolicy,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">Templates</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">検索条件</h1>
        <p className="text-sm text-[#1A1E3C]/70 mt-1">よく使う条件を保存して会食依頼をすばやく作成</p>
      </div>

      <TemplateManager initialTemplates={templates} />
    </div>
  );
}
