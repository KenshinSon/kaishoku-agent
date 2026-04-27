"use client";

import { useState } from "react";
import BookingUpgradeModal from "@/app/(app)/_components/BookingUpgradeModal";

export default function BookingRequestButton({
  venueId,
  diningRequestId,
  recommendationVenueId,
}: {
  venueId: string;
  diningRequestId: string;
  recommendationVenueId: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-xs border-2 border-gray-300 bg-gray-100 text-gray-600 rounded-lg font-medium hover:border-[#1A1E3C] hover:text-[#1A1E3C] hover:bg-gray-50 transition-colors"
        data-venue={venueId}
        data-request={diningRequestId}
        data-rv={recommendationVenueId}
      >
        📞 予約を代行依頼する
      </button>

      {showModal && <BookingUpgradeModal onClose={() => setShowModal(false)} />}
    </>
  );
}
