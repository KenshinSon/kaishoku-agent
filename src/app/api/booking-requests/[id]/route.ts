import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { bookingCancelledHtml, bookingUpdatedHtml } from "@/lib/email-templates";

async function getOwnedBooking(id: string, userId: string) {
  return prisma.bookingRequest.findUnique({
    where: { id },
    include: { venue: { select: { id: true, name: true, address: true } } },
  }).then((b) => (b?.userId === userId ? b : null));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const booking = await getOwnedBooking(id, session.user.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "キャンセル済みの予約は変更できません" }, { status: 400 });
  }

  const { preferredDate, guestCount, specialRequests } = await request.json();

  const updated = await prisma.bookingRequest.update({
    where: { id },
    data: {
      ...(preferredDate !== undefined && { preferredDate: preferredDate ? new Date(preferredDate) : null }),
      ...(guestCount !== undefined && { guestCount: guestCount ?? null }),
      ...(specialRequests !== undefined && { specialRequests: specialRequests || null }),
    },
    include: { venue: { select: { name: true, address: true } } },
  });

  // 変更通知メール
  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } });
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `【ビジめし】予約内容を変更しました — ${updated.venue.name}`,
        html: bookingUpdatedHtml({
          userName: user.name ?? "ユーザー",
          venueName: updated.venue.name,
          venueAddress: updated.venue.address,
          preferredDate: updated.preferredDate,
          guestCount: updated.guestCount,
          specialRequests: updated.specialRequests,
        }),
      });
    }
  } catch (e) {
    console.error("[email] booking updated:", e);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const booking = await getOwnedBooking(id, session.user.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "すでにキャンセル済みです" }, { status: 400 });
  }

  const cancelled = await prisma.bookingRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { venue: { select: { name: true, address: true } } },
  });

  // キャンセル通知メール
  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } });
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `【ビジめし】予約をキャンセルしました — ${cancelled.venue.name}`,
        html: bookingCancelledHtml({
          userName: user.name ?? "ユーザー",
          venueName: cancelled.venue.name,
          venueAddress: cancelled.venue.address,
          preferredDate: cancelled.preferredDate,
        }),
      });
    }
  } catch (e) {
    console.error("[email] booking cancelled:", e);
  }

  return NextResponse.json(cancelled);
}
