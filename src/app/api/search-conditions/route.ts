import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    templateName, preferredArea, budgetPerPerson, totalGuests,
    cuisinePrefs, drinkPrefs, atmosphereNote, privateRoom, smokingPolicy,
    transportMode, locationPriority, foodLikes, foodDislikes, foodAbsoluteNg,
  } = await request.json();

  const template = await prisma.diningRequest.create({
    data: {
      userId: session.user.id,
      templateName: templateName || null,
      preferredArea: preferredArea || null,
      budgetPerPerson: budgetPerPerson ? Number(budgetPerPerson) : null,
      totalGuests: totalGuests ? Number(totalGuests) : null,
      cuisinePrefs: cuisinePrefs ?? [],
      drinkPrefs: drinkPrefs ?? [],
      atmosphereNote: atmosphereNote || null,
      privateRoom: privateRoom || null,
      smokingPolicy: smokingPolicy || null,
      transportMode: transportMode || null,
      locationPriority: locationPriority || null,
      foodLikes: foodLikes || null,
      foodDislikes: foodDislikes || null,
      foodAbsoluteNg: foodAbsoluteNg || null,
      ngConditions: [],
      status: "TEMPLATE",
    },
  });
  return NextResponse.json(template, { status: 201 });
}
