import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { extractVenuesBlock, extractDiningConditions } from "@/lib/chat-parser";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは「ビジめし」のAI会食コンシェルジュです。
ビジネス会食の店選びを専門にサポートします。

【できること】
- 自然言語での店舗検索（エリア・予算・人数・ジャンル・雰囲気）
- 会食依頼フォームの作成支援（必要情報を会話で収集）
- 会食に関するアドバイス（席選び・接待マナー・ドリンク選び）

【店舗提案時のルール】
- チェーン店は絶対に推薦しない
- 予算・目的・相手に合った店を提案
- 提案は3件以内に絞る
- 提案時は必ず理由を添える（目的・席環境・ドリンク・予算の観点で）

【会話スタイル】
- 簡潔でテンポよく
- 丁寧だがフレンドリー
- 不明な情報は自然に聞き返す

【重要】店舗を提案する場合は、本文の後に必ず以下の形式のブロックを追加する（Markdownコードブロック不要、タグで囲む）：
<VENUES>
[
  {
    "name": "店名",
    "area": "エリア（例: 渋谷）",
    "reason": "提案理由（目的・席環境・ドリンク・予算の観点で100字程度）",
    "budgetRange": "¥8,000〜¥12,000",
    "genre": "和食/寿司/焼鳥/イタリアン等",
    "googleMapsQuery": "店名 エリア 食事",
    "tabelogQuery": "店名 エリア"
  }
]
</VENUES>

ユーザーが「依頼を作成して」「フォームに入れて」などと言った場合は、/requests/new ページに誘導してください。`;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, sessionId } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // セッション取得 or 新規作成
  let chatSession;
  if (sessionId) {
    chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
  } else {
    chatSession = await prisma.chatSession.create({
      data: { userId: session.user.id, title: message.slice(0, 40) },
    });
  }

  // ユーザーメッセージを保存
  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "user", content: message },
  });

  // 直近10件の会話履歴を取得
  const history = await prisma.chatMessage.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { createdAt: "asc" },
    take: -10,
  });

  // Claude API呼び出し
  let rawContent = "";
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        } as Parameters<typeof client.messages.create>[0]["system"] extends Array<infer T> ? T : never,
      ],
      messages: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });
    rawContent = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
  } catch {
    rawContent = "申し訳ありません、一時的なエラーが発生しました。もう一度お試しください。";
  }

  // VENUESブロックを抽出
  const extracted = extractVenuesBlock(rawContent);

  if (extracted) {
    const { venues, cleanedText } = extracted;

    // 会話全体から条件を抽出
    const conversationText = history.map((m) => m.content).join("\n") + "\n" + message;
    const conditions = extractDiningConditions(conversationText);

    // DiningRequest を自動作成
    const diningRequest = await prisma.diningRequest.create({
      data: {
        userId: session.user.id,
        source: "chat",
        status: "PROPOSED",
        preferredArea: conditions.preferredArea ?? null,
        totalGuests: conditions.totalGuests ?? null,
        budgetPerPerson: conditions.budgetPerPerson ?? null,
        cuisinePrefs: conditions.cuisinePrefs ?? [],
      },
    });

    // Recommendation 作成
    const recommendation = await prisma.recommendation.create({
      data: {
        diningRequestId: diningRequest.id,
        userId: session.user.id,
        aiModel: "claude-sonnet-4-5",
      },
    });

    // 各 Venue を upsert して RecommendationVenue を作成
    for (let i = 0; i < venues.length; i++) {
      const v = venues[i];
      let venue = await prisma.venue.findFirst({ where: { name: v.name } });
      if (!venue) {
        venue = await prisma.venue.create({
          data: {
            name: v.name,
            nearestStation: v.area || null,
            cuisineType: v.genre || null,
          },
        });
      }
      await prisma.recommendationVenue.create({
        data: {
          recommendationId: recommendation.id,
          venueId: venue.id,
          rank: i + 1,
          reason: v.reason,
        },
      });
    }

    const metadata = {
      type: "venue_suggestion",
      requestId: diningRequest.id,
      venues,
    };

    // アシスタントメッセージをメタデータ付きで保存
    await prisma.chatMessage.create({
      data: { sessionId: chatSession.id, role: "assistant", content: cleanedText, metadata },
    });
    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      message: cleanedText,
      type: "venue_suggestion",
      requestId: diningRequest.id,
      venues,
    });
  }

  // 通常テキストレスポンス
  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "assistant", content: rawContent },
  });
  await prisma.chatSession.update({
    where: { id: chatSession.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ sessionId: chatSession.id, message: rawContent, type: "text" });
}
