import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DMClient from "./_components/DMClient";

export default async function DMPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const convs = await prisma.dMConversation.findMany({
    where: { OR: [{ user1Id: uid }, { user2Id: uid }] },
    include: {
      user1: { select: { id: true, name: true, image: true, isPublicProfile: true } },
      user2: { select: { id: true, name: true, image: true, isPublicProfile: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true, senderId: true, readAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversations = convs.map((c) => ({
    id: c.id,
    otherUser: c.user1Id === uid ? c.user2 : c.user1,
    lastMessage: c.messages[0]
      ? { ...c.messages[0], createdAt: c.messages[0].createdAt.toISOString(), readAt: c.messages[0].readAt?.toISOString() ?? null }
      : null,
    unreadCount: c.messages.filter((m) => m.senderId !== uid && !m.readAt).length,
  }));

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">Messages</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">DM</h1>
      </div>
      <DMClient conversations={conversations} currentUserId={uid} />
    </div>
  );
}
