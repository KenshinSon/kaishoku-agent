import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

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

  const result = convs.map((c) => ({
    id: c.id,
    otherUser: c.user1Id === uid ? c.user2 : c.user1,
    lastMessage: c.messages[0] ?? null,
    unreadCount: c.messages.filter((m) => m.senderId !== uid && !m.readAt).length,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetId } = await request.json();
  if (!targetId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (targetId === session.user.id) {
    return NextResponse.json({ error: "自分自身にはDMできません" }, { status: 400 });
  }

  // 常に小さいIDをuser1に
  const [user1Id, user2Id] = [session.user.id, targetId].sort();

  const conv = await prisma.dMConversation.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    create: { user1Id, user2Id },
    update: {},
  });

  return NextResponse.json(conv, { status: 201 });
}
