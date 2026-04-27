-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "businessResult" TEXT,
ADD COLUMN     "diningRequestId" TEXT,
ADD COLUMN     "privateNote" TEXT,
ADD COLUMN     "ratingCostPerf" INTEGER,
ADD COLUMN     "ratingDrink" INTEGER,
ADD COLUMN     "ratingFood" INTEGER,
ADD COLUMN     "ratingQuietness" INTEGER,
ADD COLUMN     "ratingSeating" INTEGER,
ADD COLUMN     "ratingService" INTEGER,
ADD COLUMN     "venueId" TEXT,
ADD COLUMN     "wouldRevisit" BOOLEAN;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "averageRating" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_diningRequestId_fkey" FOREIGN KEY ("diningRequestId") REFERENCES "DiningRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
