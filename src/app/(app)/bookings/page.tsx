import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingsClient from "./_components/BookingsClient";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const bookings = await prisma.bookingRequest.findMany({
    where: { userId: uid },
    include: { venue: { select: { id: true, name: true, address: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = bookings.map((b: (typeof bookings)[number]) => ({
    id: b.id,
    status: b.status,
    preferredDate: b.preferredDate ? b.preferredDate.toISOString() : null,
    guestCount: b.guestCount,
    specialRequests: b.specialRequests,
    createdAt: b.createdAt.toISOString(),
    venue: b.venue,
  }));

  return (
    <div className="space-y-0">
      <div className="bg-[#FFED00] -mx-6 -mt-8 px-6 pt-8 pb-6 mb-6">
        <p className="text-xs text-[#1A1E3C]/60 font-medium uppercase tracking-widest mb-1">Bookings</p>
        <h1 className="text-2xl font-black text-[#1A1E3C]">予約依頼</h1>
        <p className="text-sm text-[#1A1E3C]/60 mt-1">代行予約のステータス一覧</p>
      </div>

      <BookingsClient initialBookings={serialized} />
    </div>
  );
}
