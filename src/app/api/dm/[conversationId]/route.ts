import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertMember(conversationId: string, userId: string) {
  const conv = await prisma.dMConversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.user1Id !== userId && conv.user2Id !== userId)) return null;
  return conv;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.dMMessage.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  // 相手メッセージを既読に
  await prisma.dMMessage.updateMany({
    where: { conversationId, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const [message] = await prisma.$transaction([
    prisma.dMMessage.create({
      data: { conversationId, senderId: session.user.id, content: content.trim() },
      include: { sender: { select: { id: true, name: true, image: true } } },
    }),
    prisma.dMConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);

  return NextResponse.json(message, { status: 201 });
}
