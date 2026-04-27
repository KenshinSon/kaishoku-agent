import type { RawVenue, ScoredVenue, SearchParams, ScoreBreakdown } from "../connectors/types";

const CHAIN_NAMES = [
  "鳥貴族", "魚民", "和民", "白木屋", "笑笑", "塚田農場", "八剣伝",
  "土間土間", "赤から", "庄や", "日本海庄や", "養老乃瀧", "甘太郎",
  "つぼ八", "北の家族", "ごちそう酒家", "温野菜", "しゃぶ葉",
  "すき家", "なか卯", "牛角", "焼肉きんぐ", "バーミヤン", "ガスト",
  "ジョナサン", "デニーズ", "サイゼリヤ", "ビッグボーイ", "ロイヤルホスト",
  "モンテローザ", "チムニー", "はなの舞", "さくら水産", "磯丸水産",
  "串カツ田中", "鍛冶屋文蔵", "村さ来", "ワタミ", "和民",
];

function isChainRestaurant(venue: RawVenue): boolean {
  return CHAIN_NAMES.some((chain) => venue.name.includes(chain));
}

function scoreService(venue: RawVenue): number {
  const rating = venue.rating ?? 3.5;
  const count = venue.userRatingCount ?? 0;
  let score = Math.min((rating - 3.0) / 2.0, 1.0);
  if (count > 100) score += 0.05;
  if (count > 300) score += 0.05;
  return Math.max(0, Math.min(1, score));
}

function scoreSeating(venue: RawVenue, guests: number | null, privateRoom: string | null): number {
  const priceLevel = venue.priceLevel ?? 2;
  let score = 0.5;

  // 個室希望への対応を価格帯で推定
  if (privateRoom === "個室必須") {
    score = priceLevel >= 3 ? 0.85 : 0.35;
  } else if (privateRoom === "半個室可") {
    score = priceLevel >= 2 ? 0.70 : 0.50;
  } else {
    score = 0.65;
  }

  // 人数による調整
  if (guests && guests >= 6 && priceLevel >= 3) score = Math.min(score + 0.1, 1.0);
  if (guests && guests <= 2) score = Math.min(score + 0.05, 1.0);

  return score;
}

function scoreDrinkware(venue: RawVenue, drinkPrefs: string[]): number {
  if (drinkPrefs.length === 0) return 0.5;
  const priceLevel = venue.priceLevel ?? 2;
  if (drinkPrefs.includes("ワイン") && priceLevel >= 3) return 0.9;
  if (drinkPrefs.includes("日本酒")) {
    const isJapanese = venue.types.some(
      (t) => t.includes("japanese") || t.includes("sushi")
    );
    return isJapanese ? 0.88 : 0.4;
  }
  if (drinkPrefs.includes("ノンアル")) return 0.6;
  return priceLevel >= 2 ? 0.65 : 0.45;
}

function scoreQuietness(venue: RawVenue, atmosphereNote: string | null): number {
  const priceLevel = venue.priceLevel ?? 2;
  if (!atmosphereNote) return priceLevel >= 2 ? 0.65 : 0.45;
  if (atmosphereNote === "静かめ") return priceLevel >= 3 ? 0.88 : 0.40;
  if (atmosphereNote === "賑やか") return priceLevel <= 2 ? 0.80 : 0.50;
  return 0.62;
}

function scoreBudgetFit(venue: RawVenue, budgetPerPerson: number | null): number {
  if (!budgetPerPerson || venue.priceLevel === null) return 0.5;
  const priceLevelToYen: Record<number, number> = {
    0: 0, 1: 3000, 2: 7000, 3: 13000, 4: 22000,
  };
  const estimated = priceLevelToYen[venue.priceLevel] ?? 7000;
  const ratio = estimated / budgetPerPerson;
  if (ratio <= 0.65) return 0.55;
  if (ratio <= 0.85) return 0.90;
  if (ratio <= 1.05) return 1.00;
  if (ratio <= 1.25) return 0.55;
  return 0.10;
}

function scorePurposeFit(venue: RawVenue, purpose: string | null): number {
  if (!purpose) return 0.5;
  const priceLevel = venue.priceLevel ?? 2;
  const isUpscale = priceLevel >= 3;
  const isJapanese = venue.types.some((t) => t.includes("japanese") || t.includes("sushi"));

  switch (purpose) {
    case "初回顔合わせ":
      return isUpscale ? 0.82 : 0.58;
    case "関係構築":
      return isUpscale ? 0.82 : 0.68;
    case "受注獲得":
    case "クロージング":
      return isUpscale && isJapanese ? 0.95 : isUpscale ? 0.85 : 0.35;
    case "御礼":
      return isUpscale ? 0.95 : 0.30;
    case "採用アトラクト": {
      const isTrendy = venue.types.some((t) => t.includes("italian") || t.includes("french"));
      return isTrendy ? 0.88 : isUpscale ? 0.72 : 0.60;
    }
    default:
      return 0.5;
  }
}

function getPurposeWeights(purpose: string | null): ScoreBreakdown {
  const base: ScoreBreakdown = {
    service: 0.25,
    seating: 0.15,
    drinkware: 0.10,
    quietness: 0.15,
    budgetFit: 0.20,
    purposeFit: 0.15,
  };

  switch (purpose) {
    case "受注獲得":
    case "クロージング":
      base.seating *= 2.0;
      base.service *= 1.5;
      break;
    case "初回顔合わせ":
      base.quietness *= 1.5;
      base.seating *= 1.5;
      break;
    case "採用アトラクト":
      base.quietness *= 1.5;
      base.budgetFit *= 1.2;
      break;
    case "御礼":
      base.purposeFit *= 2.0;
      break;
  }

  // 正規化
  const total = Object.values(base).reduce((a, b) => a + b, 0);
  return {
    service: base.service / total,
    seating: base.seating / total,
    drinkware: base.drinkware / total,
    quietness: base.quietness / total,
    budgetFit: base.budgetFit / total,
    purposeFit: base.purposeFit / total,
  };
}

export function applyRules(venues: RawVenue[], ctx: SearchParams): ScoredVenue[] {
  const weights = getPurposeWeights(ctx.purpose);
  const results: ScoredVenue[] = [];

  for (const venue of venues) {
    const chain = isChainRestaurant(venue);
    const rating = venue.rating ?? 0;

    // 評価3.8未満・チェーン店・priceLevel 1以下はスキップ
    if (chain || rating < 3.8) continue;
    if (venue.priceLevel !== null && venue.priceLevel <= 1) continue;

    const hasNgMatch = ctx.ngConditions.some(
      (ng) => venue.name.includes(ng) || venue.address.includes(ng)
    );
    if (hasNgMatch) continue;

    const breakdown: ScoreBreakdown = {
      service: scoreService(venue),
      seating: scoreSeating(venue, ctx.totalGuests, ctx.privateRoom),
      drinkware: scoreDrinkware(venue, ctx.cuisinePrefs),
      quietness: scoreQuietness(venue, ctx.privateRoom),
      budgetFit: scoreBudgetFit(venue, ctx.budgetPerPerson),
      purposeFit: scorePurposeFit(venue, ctx.purpose),
    };

    const score =
      breakdown.service * weights.service +
      breakdown.seating * weights.seating +
      breakdown.drinkware * weights.drinkware +
      breakdown.quietness * weights.quietness +
      breakdown.budgetFit * weights.budgetFit +
      breakdown.purposeFit * weights.purposeFit;

    results.push({ ...venue, score, breakdown, isChain: chain });
  }

  return results.sort((a, b) => b.score - a.score);
}
