export type VenueSuggestion = {
  name: string;
  area: string;
  reason: string;
  budgetRange: string;
  genre: string;
  googleMapsQuery: string;
  tabelogQuery: string;
};

export type ExtractedConditions = {
  area?: string;
  preferredArea?: string;
  totalGuests?: number;
  budgetPerPerson?: number;
  cuisinePrefs?: string[];
};

const KNOWN_AREAS = [
  "渋谷", "銀座", "新宿", "恵比寿", "中目黒", "六本木", "品川", "丸の内",
  "表参道", "赤坂", "汐留", "虎ノ門", "上野", "池袋", "秋葉原", "神保町",
  "日本橋", "有楽町", "四谷", "麻布", "西麻布", "白金", "代官山",
];
const KNOWN_GENRES = ["和食", "寿司", "焼鳥", "肉", "イタリアン", "フレンチ", "中華", "焼肉", "しゃぶしゃぶ", "天ぷら"];

export function extractDiningConditions(text: string): ExtractedConditions {
  const result: ExtractedConditions = {};

  // 人数
  const guestMatch = text.match(/(\d+)\s*[名人]/);
  if (guestMatch) result.totalGuests = parseInt(guestMatch[1]);

  // 予算（「1万」「1万円」「10000円」「15000円」）
  const manMatch = text.match(/(\d+(?:\.\d+)?)\s*万\s*円?/);
  const enMatch = text.match(/(\d{4,6})\s*円/);
  if (manMatch) {
    result.budgetPerPerson = Math.round(parseFloat(manMatch[1]) * 10000);
  } else if (enMatch) {
    result.budgetPerPerson = parseInt(enMatch[1]);
  }

  // エリア（最初にマッチしたもの）
  for (const area of KNOWN_AREAS) {
    if (text.includes(area)) {
      result.area = area;
      result.preferredArea = area;
      break;
    }
  }

  // ジャンル
  const matched = KNOWN_GENRES.filter((g) => text.includes(g));
  if (matched.length > 0) result.cuisinePrefs = matched;

  return result;
}

export function extractVenuesBlock(text: string): { venues: VenueSuggestion[]; cleanedText: string } | null {
  const match = text.match(/<VENUES>([\s\S]*?)<\/VENUES>/);
  if (!match) return null;

  try {
    const venues = JSON.parse(match[1].trim()) as VenueSuggestion[];
    if (!Array.isArray(venues) || venues.length === 0) return null;
    const cleanedText = text.replace(/<VENUES>[\s\S]*?<\/VENUES>/, "").trim();
    return { venues, cleanedText };
  } catch {
    return null;
  }
}
