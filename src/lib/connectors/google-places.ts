import type { Connector, RawVenue, SearchParams } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.internationalPhoneNumber",
  "places.primaryType",
  "places.editorialSummary",
].join(",");

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const CUISINE_TYPE_MAP: Record<string, string[]> = {
  和食: ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant"],
  海鮮: ["seafood_restaurant", "japanese_restaurant"],
  寿司: ["sushi_restaurant"],
  焼鳥: ["japanese_restaurant"],
  肉: ["steak_house", "barbecue_restaurant"],
  中華: ["chinese_restaurant"],
  イタリアン: ["italian_restaurant"],
};

// 開発用モックデータ（Google Places APIが有効化されるまでのフォールバック）
const MOCK_VENUES: RawVenue[] = [
  {
    id: "mock-001",
    name: "銀座 鮨さいとう",
    address: "東京都中央区銀座4-2-15",
    lat: 35.6714, lng: 139.7660,
    rating: 4.5, userRatingCount: 320,
    priceLevel: 4,
    types: ["sushi_restaurant", "japanese_restaurant"],
    websiteUri: null,
    googleMapsUrl: "https://maps.google.com/?q=銀座+鮨さいとう",
    internationalPhoneNumber: null,
    primaryType: "sushi_restaurant",
    editorialSummary: "銀座の高級鮨店。厳選された食材を使った江戸前鮨。",
  },
  {
    id: "mock-002",
    name: "日本橋 和食 小室",
    address: "東京都中央区日本橋室町1-5-3",
    lat: 35.6840, lng: 139.7744,
    rating: 4.3, userRatingCount: 185,
    priceLevel: 3,
    types: ["japanese_restaurant"],
    websiteUri: null,
    googleMapsUrl: "https://maps.google.com/?q=日本橋+和食+小室",
    internationalPhoneNumber: null,
    primaryType: "japanese_restaurant",
    editorialSummary: "接待・会食に最適な落ち着いた和食の名店。",
  },
  {
    id: "mock-003",
    name: "丸の内 ビストロ ラ・ターブル",
    address: "東京都千代田区丸の内2-4-1",
    lat: 35.6790, lng: 139.7638,
    rating: 4.1, userRatingCount: 240,
    priceLevel: 3,
    types: ["french_restaurant", "restaurant"],
    websiteUri: null,
    googleMapsUrl: "https://maps.google.com/?q=丸の内+ビストロ",
    internationalPhoneNumber: null,
    primaryType: "french_restaurant",
    editorialSummary: "丸の内の洗練されたフレンチビストロ。ビジネス会食に人気。",
  },
  {
    id: "mock-004",
    name: "新橋 焼鳥 炭火 鳥どん",
    address: "東京都港区新橋2-5-8",
    lat: 35.6665, lng: 139.7571,
    rating: 4.0, userRatingCount: 510,
    priceLevel: 2,
    types: ["japanese_restaurant"],
    websiteUri: null,
    googleMapsUrl: "https://maps.google.com/?q=新橋+焼鳥+炭火+鳥どん",
    internationalPhoneNumber: null,
    primaryType: "japanese_restaurant",
    editorialSummary: "炭火で丁寧に焼き上げた串焼きと地酒が自慢の一軒。",
  },
  {
    id: "mock-005",
    name: "神楽坂 ル・クープ・シュー",
    address: "東京都新宿区神楽坂6-3",
    lat: 35.7012, lng: 139.7415,
    rating: 4.2, userRatingCount: 178,
    priceLevel: 3,
    types: ["italian_restaurant", "restaurant"],
    websiteUri: null,
    googleMapsUrl: "https://maps.google.com/?q=神楽坂+ル・クープ・シュー",
    internationalPhoneNumber: null,
    primaryType: "italian_restaurant",
    editorialSummary: "神楽坂の路地裏にある隠れ家的イタリアン。半個室あり。",
  },
  {
    id: "mock-006",
    name: "銀座 割烹 一白水成",
    address: "東京都中央区銀座6-5-13",
    lat: 35.6704, lng: 139.7636,
    rating: 4.4, userRatingCount: 95,
    priceLevel: 4,
    types: ["japanese_restaurant"],
    websiteUri: null,
    googleMapsUrl: "https://maps.google.com/?q=銀座+割烹+一白水成",
    internationalPhoneNumber: null,
    primaryType: "japanese_restaurant",
    editorialSummary: "旬の食材を使った本格割烹。個室完備で重要な接待に。",
  },
];

async function geocode(query: string, apiKey: string): Promise<{ lat: number; lng: number }> {
  // Google Geocoding API（利用可能な場合）
  const googleUrl = `${GEOCODING_URL}?address=${encodeURIComponent(query + " 日本")}&key=${apiKey}&language=ja`;
  const googleRes = await fetch(googleUrl);
  if (googleRes.ok) {
    const data = await googleRes.json();
    if (data.status === "OK" && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  }

  // Nominatimフォールバック（Google Geocoding APIが使えない場合）
  console.warn(`[geocode] Google Geocoding unavailable for "${query}", falling back to Nominatim`);
  const searchQuery = query.includes("日本") || query.includes("Tokyo") ? query : `${query} 日本`;
  const nominatimUrl = `${NOMINATIM_URL}?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=ja`;
  const nominatimRes = await fetch(nominatimUrl, {
    headers: { "User-Agent": "kaishoku-agent/1.0 (business dining recommendation app)" },
  });
  if (nominatimRes.ok) {
    const data = await nominatimRes.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  }

  console.warn(`[geocode] All geocoding failed for "${query}", defaulting to Tokyo station`);
  return { lat: 35.6812, lng: 139.7671 };
}

export class GooglePlacesConnector implements Connector {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(params: SearchParams): Promise<RawVenue[]> {
    const { lat, lng } = await geocode(params.locationQuery, this.apiKey);

    const includedTypes = params.cuisinePrefs.length > 0
      ? params.cuisinePrefs.flatMap((c) => CUISINE_TYPE_MAP[c] ?? [])
      : ["restaurant", "japanese_restaurant"];

    const uniqueTypes = [...new Set(includedTypes)];

    const body = {
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: params.radiusMeters,
        },
      },
      includedTypes: uniqueTypes.slice(0, 50),
      maxResultCount: 20,
      languageCode: "ja",
    };

    const res = await fetch(NEARBY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error?.message ?? `HTTP ${res.status}`;
      const reason = errJson?.error?.details?.[0]?.reason ?? errJson?.error?.status ?? "";

      // Places API が無効 or キー制限の場合、開発用モックデータにフォールバック
      if (
        reason === "API_KEY_INVALID" ||
        errJson?.error?.status === "PERMISSION_DENIED" ||
        errJson?.error?.status === "REQUEST_DENIED"
      ) {
        console.warn(
          `[places] Google Places API unavailable (${reason || errJson?.error?.status}), using mock data. ` +
          `Fix: Enable "Places API (New)" at https://console.cloud.google.com/apis/library/places-backend.googleapis.com`
        );
        return MOCK_VENUES;
      }

      throw new Error(
        `Google Places API エラー: ${errMsg}${reason ? ` (${reason})` : ""}`
      );
    }

    const data = await res.json();
    const places = data.places ?? [];

    if (places.length === 0) {
      console.warn("[places] Places API returned 0 results, using mock data");
      return MOCK_VENUES;
    }

    return places.map((p: Record<string, unknown>): RawVenue => {
      const displayName = p.displayName as { text?: string } | null;
      const location = p.location as { latitude: number; longitude: number } | null;
      const editorialSummary = p.editorialSummary as { text?: string } | null;
      const priceLevelStr = typeof p.priceLevel === "string" ? p.priceLevel : null;

      return {
        id: p.id as string,
        name: displayName?.text ?? "",
        address: (p.formattedAddress as string) ?? "",
        lat: location?.latitude ?? 0,
        lng: location?.longitude ?? 0,
        rating: typeof p.rating === "number" ? p.rating : null,
        userRatingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
        priceLevel: priceLevelStr ? (PRICE_LEVEL_MAP[priceLevelStr] ?? null) : null,
        types: Array.isArray(p.types) ? (p.types as string[]) : [],
        websiteUri: typeof p.websiteUri === "string" ? p.websiteUri : null,
        googleMapsUrl: typeof p.googleMapsUri === "string" ? p.googleMapsUri : null,
        internationalPhoneNumber: typeof p.internationalPhoneNumber === "string" ? p.internationalPhoneNumber : null,
        primaryType: typeof p.primaryType === "string" ? p.primaryType : null,
        editorialSummary: editorialSummary?.text ?? null,
      };
    });
  }
}
