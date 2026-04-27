const BASE_STYLE = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #F8F7F4;
  padding: 32px 16px;
`;
const CARD_STYLE = `
  background: #fff;
  border: 2px solid #1A1E3C;
  border-radius: 16px;
  padding: 32px;
  max-width: 520px;
  margin: 0 auto;
`;
const HEADER_STYLE = `
  background: #FFED00;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 24px;
`;
const BTN_STYLE = `
  display: inline-block;
  background: #1A1E3C;
  color: #FFED00;
  font-weight: 900;
  font-size: 15px;
  padding: 14px 28px;
  border-radius: 12px;
  text-decoration: none;
`;

type BookingInfo = {
  userName: string;
  venueName: string;
  venueAddress?: string | null;
  preferredDate?: Date | null;
  guestCount?: number | null;
  specialRequests?: string | null;
};

function formatDate(d: Date) {
  return d.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function bookingConfirmedHtml(info: BookingInfo): string {
  const dateStr = info.preferredDate ? formatDate(info.preferredDate) : "日時未定";
  return `
<div style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    <div style="${HEADER_STYLE}">
      <p style="margin:0;font-size:22px;font-weight:900;color:#1A1E3C;">🍽 予約が確定しました</p>
    </div>
    <p style="color:#1A1E3C;margin-bottom:20px;">${info.userName} さん、予約代行が完了しました。以下の内容でご予約いたしました。</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#666;font-size:13px;width:100px;">お店</td><td style="padding:8px 0;font-weight:700;color:#1A1E3C;">${info.venueName}</td></tr>
      ${info.venueAddress ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">住所</td><td style="padding:8px 0;color:#555;font-size:13px;">${info.venueAddress}</td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#666;font-size:13px;">日時</td><td style="padding:8px 0;font-weight:700;color:#1A1E3C;">${dateStr}</td></tr>
      ${info.guestCount ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">人数</td><td style="padding:8px 0;color:#1A1E3C;">${info.guestCount}名</td></tr>` : ""}
      ${info.specialRequests ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">リクエスト</td><td style="padding:8px 0;color:#555;font-size:13px;">${info.specialRequests}</td></tr>` : ""}
    </table>
    <p style="font-size:13px;color:#888;margin-bottom:24px;">ご不明な点はビジめしサポートまでご連絡ください。</p>
    <a href="${process.env.NEXTAUTH_URL ?? "https://bizumeshi.com"}/bookings" style="${BTN_STYLE}">予約詳細を確認する</a>
    <p style="margin-top:32px;font-size:11px;color:#aaa;">このメールはビジめしから自動送信されました。</p>
  </div>
</div>`;
}

export function bookingCancelledHtml(info: BookingInfo): string {
  return `
<div style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    <div style="background:#fee2e2;border-radius:12px;padding:16px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:22px;font-weight:900;color:#1A1E3C;">🚫 予約をキャンセルしました</p>
    </div>
    <p style="color:#1A1E3C;margin-bottom:20px;">${info.userName} さん、以下の予約依頼をキャンセルしました。</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#666;font-size:13px;width:100px;">お店</td><td style="padding:8px 0;font-weight:700;color:#1A1E3C;">${info.venueName}</td></tr>
      ${info.preferredDate ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">予定日時</td><td style="padding:8px 0;color:#1A1E3C;">${formatDate(info.preferredDate)}</td></tr>` : ""}
    </table>
    <p style="font-size:13px;color:#888;margin-bottom:24px;">また次回のご利用をお待ちしております。</p>
    <a href="${process.env.NEXTAUTH_URL ?? "https://bizumeshi.com"}/requests/new" style="${BTN_STYLE}">新しい会食を依頼する</a>
    <p style="margin-top:32px;font-size:11px;color:#aaa;">このメールはビジめしから自動送信されました。</p>
  </div>
</div>`;
}

export function bookingUpdatedHtml(info: BookingInfo): string {
  const dateStr = info.preferredDate ? formatDate(info.preferredDate) : "日時未定";
  return `
<div style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    <div style="${HEADER_STYLE}">
      <p style="margin:0;font-size:22px;font-weight:900;color:#1A1E3C;">✏️ 予約内容を変更しました</p>
    </div>
    <p style="color:#1A1E3C;margin-bottom:20px;">${info.userName} さん、予約依頼の内容を更新しました。</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#666;font-size:13px;width:100px;">お店</td><td style="padding:8px 0;font-weight:700;color:#1A1E3C;">${info.venueName}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;">希望日時</td><td style="padding:8px 0;font-weight:700;color:#1A1E3C;">${dateStr}</td></tr>
      ${info.guestCount ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">人数</td><td style="padding:8px 0;color:#1A1E3C;">${info.guestCount}名</td></tr>` : ""}
      ${info.specialRequests ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">リクエスト</td><td style="padding:8px 0;color:#555;font-size:13px;">${info.specialRequests}</td></tr>` : ""}
    </table>
    <a href="${process.env.NEXTAUTH_URL ?? "https://bizumeshi.com"}/bookings" style="${BTN_STYLE}">予約詳細を確認する</a>
    <p style="margin-top:32px;font-size:11px;color:#aaa;">このメールはビジめしから自動送信されました。</p>
  </div>
</div>`;
}
