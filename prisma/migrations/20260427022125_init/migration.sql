-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SEARCHING', 'PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('REQUEST_CREATED', 'RECOMMENDATION_VIEWED', 'VENUE_CLICKED', 'TEMPLATE_COPIED', 'VENUE_SELECTED', 'BOOKING_CONFIRMED', 'FEEDBACK_SUBMITTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "googleId" TEXT,
    "mobile" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "companyName" TEXT,
    "gender" TEXT,
    "ageRange" TEXT,
    "smokerType" TEXT,
    "preferences" JSONB,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "xUrl" TEXT,
    "tiktokUrl" TEXT,
    "snsNote" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "timeFlexible" BOOLEAN NOT NULL DEFAULT false,
    "durationMinutes" INTEGER,
    "totalGuests" INTEGER,
    "clientGuests" INTEGER,
    "ownGuests" INTEGER,
    "purpose" TEXT,
    "relationshipNote" TEXT,
    "cuisinePrefs" TEXT[],
    "drinkPrefs" TEXT[],
    "foodLikes" TEXT,
    "foodDislikes" TEXT,
    "foodAbsoluteNg" TEXT,
    "drinkMain" TEXT,
    "drinkCountEst" TEXT,
    "drinkNonAlcOk" BOOLEAN,
    "budgetPerPerson" INTEGER,
    "budgetDrinkIncluded" BOOLEAN NOT NULL DEFAULT false,
    "budgetTotal" INTEGER,
    "paymentStyle" TEXT,
    "atmosphereNote" TEXT,
    "privateRoom" TEXT,
    "seatPrefs" TEXT,
    "toneNote" TEXT,
    "photoPolicy" TEXT,
    "ngConditions" TEXT[],
    "guestDepartureLocation" TEXT,
    "guestReturnStation" TEXT,
    "ownerDepartureLocation" TEXT,
    "transportMode" TEXT,
    "gatheringTimeWindow" TEXT,
    "locationPriority" TEXT,
    "rainConsideration" BOOLEAN NOT NULL DEFAULT false,
    "dissolveRoute" TEXT,
    "preferredArea" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "nearestStation" TEXT,
    "walkMinutes" INTEGER,
    "cuisineType" TEXT,
    "priceRange" TEXT,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "isChain" BOOLEAN NOT NULL DEFAULT false,
    "smokingPolicy" TEXT,
    "hasPrivateRoom" BOOLEAN,
    "seatingType" TEXT,
    "seatingNote" TEXT,
    "tabelogUrl" TEXT,
    "googleMapsUrl" TEXT,
    "googlePlaceId" TEXT,
    "canonicalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueSource" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "sourceUrl" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "methodVersion" TEXT NOT NULL,
    "rawSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueSignal" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scoreQuietness" DOUBLE PRECISION,
    "scoreService" DOUBLE PRECISION,
    "scoreSeating" DOUBLE PRECISION,
    "scoreDrinkware" DOUBLE PRECISION,
    "scoreSmoking" DOUBLE PRECISION,
    "scoreBudgetFit" DOUBLE PRECISION,
    "scorePurposeFit" DOUBLE PRECISION,
    "scoreTotal" DOUBLE PRECISION,
    "googleRating" DOUBLE PRECISION,
    "googleReviewCount" INTEGER,
    "tabelogScore" DOUBLE PRECISION,
    "tabelogReviewCount" INTEGER,
    "ownSummary" TEXT,
    "flags" TEXT[],
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "diningRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "aiModel" TEXT,
    "aiPromptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationVenue" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "cautionNote" TEXT,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diningRequestId" TEXT,
    "eventType" "EventType" NOT NULL,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "reused" BOOLEAN,
    "decisionMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_googlePlaceId_key" ON "Venue"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSource_venueId_source_key" ON "VenueSource"("venueId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSignal_venueId_source_key" ON "VenueSignal"("venueId", "source");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningRequest" ADD CONSTRAINT "DiningRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningRequest" ADD CONSTRAINT "DiningRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueSource" ADD CONSTRAINT "VenueSource_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueSignal" ADD CONSTRAINT "VenueSignal_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_diningRequestId_fkey" FOREIGN KEY ("diningRequestId") REFERENCES "DiningRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationVenue" ADD CONSTRAINT "RecommendationVenue_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationVenue" ADD CONSTRAINT "RecommendationVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_diningRequestId_fkey" FOREIGN KEY ("diningRequestId") REFERENCES "DiningRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
