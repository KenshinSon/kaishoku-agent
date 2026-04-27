import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GooglePlacesConnector } from "@/lib/connectors/google-places";
import { applyRules } from "@/lib/engine/rules";
import { generateRecommendations } from "@/lib/engine/ai";
import type { SearchParams } from "@/lib/connectors/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const diningRequest = await prisma.diningRequest.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!diningRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const locationQuery =
    diningRequest.guestDepartureLocation ||
    diningRequest.ownerDepartureLocation ||
    "東京";

  const searchParams: SearchParams = {
    locationQuery,
    radiusMeters: 1000,
    budgetPerPerson: diningRequest.budgetPerPerson
      ? Number(diningRequest.budgetPerPerson)
      : null,
    cuisinePrefs: diningRequest.cuisinePrefs as string[],
    privateRoom: diningRequest.privateRoom,
    totalGuests: diningRequest.totalGuests,
    purpose: diningRequest.purpose,
    ngConditions: diningRequest.ngConditions as string[],
  };

  const connector = new GooglePlacesConnector(process.env.GOOGLE_PLACES_API_KEY!);
  let rawVenues;
  try {
    rawVenues = await connector.search(searchParams);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[recommend] Places API error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const scoredVenues = applyRules(rawVenues, searchParams);
  const topVenues = scoredVenues.slice(0, 5);

  if (topVenues.length === 0) {
    return NextResponse.json({ error: "候補店舗が見つかりませんでした（フィルター後に0件）" }, { status: 422 });
  }

  // Upsert venues
  for (const v of topVenues) {
    await prisma.venue.upsert({
      where: { googlePlaceId: v.id },
      update: {
        name: v.name,
        address: v.address,
        latitude: v.lat,
        longitude: v.lng,
        rating: v.rating,
        priceLevel: v.priceLevel,
        googleMapsUrl: v.googleMapsUrl,
        websiteUri: v.websiteUri,
      },
      create: {
        googlePlaceId: v.id,
        name: v.name,
        address: v.address,
        latitude: v.lat,
        longitude: v.lng,
        rating: v.rating,
        priceLevel: v.priceLevel,
        googleMapsUrl: v.googleMapsUrl,
        websiteUri: v.websiteUri,
      },
    });
  }

  const venueRecords = await prisma.venue.findMany({
    where: { googlePlaceId: { in: topVenues.map((v) => v.id) } },
  });

  let recommendations;
  try {
    recommendations = await generateRecommendations(topVenues, {
      purpose: diningRequest.purpose,
      totalGuests: diningRequest.totalGuests,
      budgetPerPerson: diningRequest.budgetPerPerson
        ? Number(diningRequest.budgetPerPerson)
        : null,
      cuisinePrefs: diningRequest.cuisinePrefs as string[],
      drinkPrefs: diningRequest.drinkPrefs as string[],
      atmosphereNote: diningRequest.atmosphereNote,
      privateRoom: diningRequest.privateRoom,
      relationshipNote: diningRequest.relationshipNote,
      ngConditions: diningRequest.ngConditions as string[],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[recommend] Claude API error:", msg);
    return NextResponse.json({ error: `AI推薦文生成エラー: ${msg}` }, { status: 502 });
  }

  // Archive old recommendations
  await prisma.recommendation.updateMany({
    where: { diningRequestId: id, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  const recommendationVenuesData = recommendations.map((rec) => {
    const venueRecord = venueRecords.find(
      (vr) => vr.googlePlaceId === rec.venueId
    );
    if (!venueRecord) throw new Error(`Venue not found for placeId: ${rec.venueId}`);
    return {
      venueId: venueRecord.id,
      rank: rec.rank,
      isBackup: rec.isBackup,
      reason: rec.reason,
      cautionNote: rec.caution,
    };
  });

  const recommendation = await prisma.recommendation.create({
    data: {
      diningRequestId: id,
      userId: session.user.id,
      venues: { create: recommendationVenuesData },
    },
    include: {
      venues: { include: { venue: true }, orderBy: { rank: "asc" } },
    },
  });

  await prisma.diningRequest.update({
    where: { id },
    data: { status: "PROPOSED" },
  });

  return NextResponse.json(recommendation, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { recommendationVenueId } = await req.json();

  const diningRequest = await prisma.diningRequest.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!diningRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recVenue = await prisma.recommendationVenue.findUnique({
    where: { id: recommendationVenueId },
    include: { recommendation: true },
  });

  if (!recVenue || recVenue.recommendation.diningRequestId !== id) {
    return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.diningRequest.update({
      where: { id },
      data: { status: "CONFIRMED" },
    }),
    prisma.recommendationVenue.update({
      where: { id: recommendationVenueId },
      data: { isSelected: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
