export interface RawVenue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null; // 0–4
  types: string[];
  websiteUri: string | null;
  googleMapsUrl: string | null;
  internationalPhoneNumber: string | null;
  primaryType: string | null;
  editorialSummary: string | null;
}

export interface ScoreBreakdown {
  service: number;
  seating: number;
  drinkware: number;
  quietness: number;
  budgetFit: number;
  purposeFit: number;
}

export interface ScoredVenue extends RawVenue {
  score: number;
  breakdown: ScoreBreakdown;
  isChain: boolean;
}

export interface SearchParams {
  locationQuery: string;
  radiusMeters: number;
  budgetPerPerson: number | null;
  cuisinePrefs: string[];
  privateRoom: string | null;
  totalGuests: number | null;
  purpose: string | null;
  ngConditions: string[];
}

export interface Connector {
  search(params: SearchParams): Promise<RawVenue[]>;
}

export interface VenueRecommendation {
  venueId: string;
  name: string;
  address: string;
  rating: number | null;
  priceLevel: number | null;
  googleMapsUrl: string | null;
  reason: string;
  caution: string | null;
  rank: number;
  isBackup: boolean;
}
