import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    date, time, timeFlexible,
    totalGuests, clientGuests, ownGuests,
    companyName, contactName, contactTitle,
    purpose, relationshipNote,
    budgetPerPerson, budgetDrinkIncluded,
    cuisinePrefs, drinkPrefs,
    atmosphereNote, privateRoom,
    guestDepartureLocation, guestReturnStation, ownerDepartureLocation,
    ngConditions,
    foodLikes, foodDislikes, foodAbsoluteNg,
    smokingPolicy,
    transportMode, locationPriority, preferredArea,
  } = body;

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, name: true },
  });

  let organizationId = user?.organizationId;
  if (!organizationId) {
    const org = await prisma.organization.create({
      data: { name: user?.name ?? "個人" },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { organizationId: org.id },
    });
    organizationId = org.id;
  }

  let contactId: string | undefined;
  if (contactName) {
    const contact = await prisma.contact.create({
      data: {
        organizationId,
        name: contactName,
        title: contactTitle || null,
        companyName: companyName || null,
      },
    });
    contactId = contact.id;
  }

  const scheduledAt =
    date ? new Date(`${date}T${time || "19:00"}`) : null;

  const diningRequest = await prisma.diningRequest.create({
    data: {
      userId: session.user.id,
      contactId: contactId ?? null,
      scheduledAt,
      timeFlexible: timeFlexible ?? false,
      totalGuests: totalGuests ? Number(totalGuests) : null,
      clientGuests: clientGuests ? Number(clientGuests) : null,
      ownGuests: ownGuests ? Number(ownGuests) : null,
      purpose: purpose || null,
      relationshipNote: relationshipNote || null,
      budgetPerPerson: budgetPerPerson ? Number(budgetPerPerson) : null,
      budgetDrinkIncluded: budgetDrinkIncluded ?? false,
      cuisinePrefs: cuisinePrefs ?? [],
      drinkPrefs: drinkPrefs ?? [],
      atmosphereNote: atmosphereNote || null,
      privateRoom: privateRoom || null,
      guestDepartureLocation: guestDepartureLocation || null,
      guestReturnStation: guestReturnStation || null,
      ownerDepartureLocation: ownerDepartureLocation || null,
      ngConditions: Array.isArray(ngConditions) ? ngConditions : [],
      foodLikes: foodLikes || null,
      foodDislikes: foodDislikes || null,
      foodAbsoluteNg: foodAbsoluteNg || null,
      smokingPolicy: smokingPolicy || null,
      transportMode: transportMode || null,
      locationPriority: locationPriority || null,
      preferredArea: preferredArea || null,
      status: "DRAFT",
    },
    include: { contact: true },
  });

  return NextResponse.json(diningRequest, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.diningRequest.findMany({
    where: { userId: session.user.id },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
