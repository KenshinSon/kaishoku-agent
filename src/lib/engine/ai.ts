import Anthropic from "@anthropic-ai/sdk";
import type { ScoredVenue, VenueRecommendation } from "../connectors/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface DiningContext {
  purpose: string | null;
  totalGuests: number | null;
  budgetPerPerson: number | null;
  cuisinePrefs: string[];
  drinkPrefs: string[];
  atmosphereNote: string | null;
  privateRoom: string | null;
  relationshipNote: string | null;
  ngConditions: string[];
  smokingPolicy?: string | null;
  foodLikes?: string | null;
  foodDislikes?: string | null;
}

interface VenueOutput {
  venueId: string;
  reason: string;
  caution: string | null;
}

const SYSTEM_PROMPT = `あなたはビジネス会食の店舗選定の最上級専門家です。
数百件の会食をプロデュースしてきた実務家として、以下の基準を絶対に守って提案理由を生成してください。

## 絶対NG条件（これに該当する店は推薦しない）
- チェーン居酒屋（鳥貴族・魚民・和民・白木屋・笑笑・モンテローザ系・ワタミ系・塚田農場・八剣伝等）
- 飲み放題プランが主体の店（酒の品質低下・グラス品質低下のリスク）
- 無地の大衆型ジョッキ・メーカーロゴ入りグラスを常用する店
- 接客品質が低い店（口コミで「雑」「遅い」「対応が悪い」の指摘がある）
- 席間が狭くプライバシーが確保できない店
- 入口・レジ・導線付近の席しかない店
- 紙おしぼり・匂い付きおしぼりの店（予算1万円超の場合）
- 翌日まで匂いが残る料理が主体の店（ニンニク多用・焼肉等）※相手希望の場合は除く

## 価格帯別の品質基準
- 〜7,000円: カジュアル会食。グラス・おしぼりの厳密さは不要
- 7,000〜15,000円: 布おしぼり・店舗選定グラス・丁寧な接客が必須
- 15,000円〜: 個室・完全なプライバシー・特別感のある体験が期待される

## 目的別の重視ポイント
- 初回顔合わせ: 静かさ・個室・格調・話しやすさ・圧迫感のない空間
- 関係構築: 会話しやすさ・適度な賑わい・料理の話題性・リラックスできる雰囲気
- 受注獲得/クロージング: 個室必須・格調・接待感・会計が見えない設計・料理提供のテンポ
- 御礼: 特別感・記念になる体験・料理のクオリティ・相手が「また来たい」と思える店
- 採用アトラクト: 自社らしさ・話しやすさ・候補者の年齢層に合った雰囲気

## 本気会食 vs 普通会食の判断
- 受注獲得・クロージング・重要人物との初回 → 本気会食基準（個室・格調・接客最重視）
- 関係構築・御礼・採用 → 普通会食基準（話題性・雰囲気・コスパも重視）

## 座席・空間の評価基準
- 完全個室（壁で仕切られている）> 半個室 > 仕切りなし
- テーブル間距離が十分か（隣の会話が聞こえないか）
- 上座・下座の設計がしやすいか
- 入口・レジから遠い席が確保できるか
- 年配者・女性がいる場合は掘りごたつ・座敷を避ける

## 提案理由の必須記載項目（各店必ず含める）
1. 【目的適合】なぜこの相手・目的・関係性に合うか（具体的に）
2. 【席環境】個室有無・静かさ・席間・プライバシー度
3. 【ドリンク適性】酒の品質・酒器・ワイン/日本酒の選定・ノンアル対応
4. 【予算フィット】コスパ評価・価格帯と体験の整合性
5. 【注意点】正直な懸念点（ミスマッチ・混雑・予約困難等）

## 本気会食における接客・備品チェック
- 予約電話での対応品質が接客品質の指標
- おしぼりの素材・品質（布製か・匂いがないか）
- グラスの品質（メーカー支給でないか）
- 日本酒・ワインの提供スタイル（ラベルを見せるか・温度管理するか）
- 会計処理（相手に見えない配慮があるか）
- トイレの清潔さ・アメニティ

## 情報の信頼性
- ユーザー投稿レビュー（食べログ・Google）を最重視
- 店舗投稿写真は演出あり・ユーザー投稿写真が実態に近い
- 点数の高さよりも口コミ内容（接客・空間・ドリンクへの言及）を重視
- 「バズり主導」の話題店は会話より写真映えが目的のケースあり

## 出力形式
JSON配列のみを返してください。各要素：
{
  "venueId": "店舗ID",
  "reason": "推薦理由（上記5項目を含む、100〜150文字）",
  "caution": "正直な注意点（あれば50文字以内、なければnull）"
}
JSON以外のテキストは一切出力しないでください。`;

export async function generateRecommendations(
  venues: ScoredVenue[],
  ctx: DiningContext
): Promise<VenueRecommendation[]> {
  const venueList = venues.map((v, i) => ({
    index: i + 1,
    id: v.id,
    name: v.name,
    address: v.address,
    rating: v.rating,
    priceLevel: v.priceLevel,
    types: v.types.join(", "),
    editorialSummary: v.editorialSummary,
    score: v.score.toFixed(3),
  }));

  const userContent = `会食の要件：
- 目的: ${ctx.purpose ?? "指定なし"}
- 参加人数: ${ctx.totalGuests ?? "未定"}名
- 予算（1人）: ${ctx.budgetPerPerson ? `¥${ctx.budgetPerPerson.toLocaleString()}` : "指定なし"}
- 料理ジャンル: ${ctx.cuisinePrefs.length > 0 ? ctx.cuisinePrefs.join("、") : "指定なし"}
- ドリンク: ${ctx.drinkPrefs.length > 0 ? ctx.drinkPrefs.join("、") : "指定なし"}
- 雰囲気: ${ctx.atmosphereNote ?? "指定なし"}
- 個室: ${ctx.privateRoom ?? "指定なし"}
- 喫煙: ${ctx.smokingPolicy ?? "指定なし"}
- 食の好み: ${ctx.foodLikes ?? "指定なし"}
- 避けたいもの: ${ctx.foodDislikes ?? "指定なし"}
- 関係性: ${ctx.relationshipNote ?? "指定なし"}
- NG条件: ${ctx.ngConditions.length > 0 ? ctx.ngConditions.join("、") : "なし"}

候補レストラン（スコア順）：
${JSON.stringify(venueList, null, 2)}

上記の店それぞれについて推薦理由と注意点をJSON配列で返してください。`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  let outputs: VenueOutput[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    outputs = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    outputs = venues.map((v) => ({
      venueId: v.id,
      reason: "会食の目的・予算に適した店舗です。",
      caution: null,
    }));
  }

  return venues.map((v, i) => {
    const output = outputs.find((o) => o.venueId === v.id) ?? {
      venueId: v.id,
      reason: "会食の目的・予算に適した店舗です。",
      caution: null,
    };
    return {
      venueId: v.id,
      name: v.name,
      address: v.address,
      rating: v.rating,
      priceLevel: v.priceLevel,
      googleMapsUrl: v.googleMapsUrl,
      reason: output.reason,
      caution: output.caution,
      rank: i + 1,
      isBackup: i >= 3,
    };
  });
}
