import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingRequest, BookingStatus, Venue } from "@prisma/client";
import BookingsClient from "./_components/BookingsClient";

type BookingWithVenue = BookingRequest & {
  venue: Pick<Venue, "id" | "name" | "address"> | null;
};

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const bookings: BookingWithVenue[] = await prisma.bookingRequest.findMany({
    where: { userId: uid },
    include: { venue: { select: { id: true, name: true, address: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = bookings.map((b: BookingWithVenue) => ({
    id: b.id,
    status: b.status as BookingStatus,
    preferredDate: b.preferredDate ? b.preferredDate.toISOString() : null,
    guestCount: b.guestCount,
    specialRequests: b.specialRequests,
    createdAt: b.createdAt.toISOString(),
    venue: b.venue,
  }));

  return <BookingsClient initialBookings={serialized} />;
}
