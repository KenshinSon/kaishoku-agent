import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./_components/SettingsClient";
import type { UserData, OrgData, PointsData } from "./_components/SettingsClient";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const [user, pointData, badges, pointHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: uid },
      include: { organization: true },
    }),
    prisma.userPoint.findUnique({ where: { userId: uid } }),
    prisma.userBadge.findMany({ where: { userId: uid } }),
    prisma.pointHistory.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const userData: UserData = {
    name: user?.name ?? null,
    email: user?.email ?? null,
    mobile: user?.mobile ?? null,
    ownerDepartureLocation: user?.ownerDepartureLocation ?? null,
    bio: user?.bio ?? null,
    isPublicProfile: user?.isPublicProfile ?? false,
    dmEnabled: user?.dmEnabled ?? false,
  };

  const orgData: OrgData = {
    id: user?.organization?.id ?? null,
    name: user?.organization?.name ?? "",
    address: user?.organization?.address ?? null,
    industry: user?.organization?.industry ?? null,
    nearestStation: user?.organization?.nearestStation ?? null,
    websiteUrl: user?.organization?.websiteUrl ?? null,
  };

  const pointsData: PointsData = {
    points: pointData?.points ?? 0,
    totalEarned: pointData?.totalEarned ?? 0,
    badges: badges.map((b) => b.badgeType),
    history: pointHistory.map((h) => ({
      id: h.id,
      points: h.points,
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">Settings</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">設定</h1>
      </div>

      <SettingsClient
        user={userData}
        org={orgData}
        points={pointsData}
        initialTab={tabParam === "plan" ? "plan" : tabParam === "company" ? "company" : "profile"}
      />
    </div>
  );
}
