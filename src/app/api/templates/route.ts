import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildEmailTemplate, buildSlackTemplate, buildTemplateVars } from "@/lib/template";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = request.nextUrl.searchParams.get("requestId");
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const [diningRequest, user, selectedRecVenue] = await Promise.all([
    prisma.diningRequest.findUnique({
      where: { id: requestId, userId: session.user.id },
      include: { contact: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    }),
    prisma.recommendationVenue.findFirst({
      where: {
        isSelected: true,
        recommendation: { diningRequestId: requestId },
      },
      include: { venue: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!diningRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const vars = buildTemplateVars({
    contactName: diningRequest.contact?.name ?? null,
    orgName: user?.organization?.name ?? null,
    userName: user?.name ?? null,
    scheduledAt: diningRequest.scheduledAt,
    totalGuests: diningRequest.totalGuests,
    clientGuests: diningRequest.clientGuests,
    ownGuests: diningRequest.ownGuests,
    venueName: selectedRecVenue?.venue.name ?? null,
    venueAddress: selectedRecVenue?.venue.address ?? null,
    mobile: user?.mobile ?? null,
  });

  return NextResponse.json({
    email: buildEmailTemplate(vars),
    slack: buildSlackTemplate(vars),
    vars,
  });
}
