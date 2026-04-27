export interface TemplateVars {
  contactName: string | null;
  orgName: string | null;
  userName: string | null;
  dateStr: string | null;
  timeStr: string | null;
  totalGuests: number | null;
  clientGuests: number | null;
  ownGuests: number | null;
  venueName: string | null;
  venueAddress: string | null;
  venueArea: string | null;
  mobile: string | null;
}

// 値がなければ全角角括弧のプレースホルダーを返す
function f(value: string | number | null | undefined, label: string): string {
  if (value == null || value === "") return `［${label}］`;
  return String(value);
}

function extractArea(address: string | null): string | null {
  if (!address) return null;
  // 「〇〇区△△」の△△部分を取り出す
  const m = address.match(/[区市]([^\d\s\-・]+)/);
  return m ? m[1] : null;
}

export function formatDateStr(scheduledAt: Date | null): string | null {
  if (!scheduledAt) return null;
  const d = new Date(scheduledAt);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function formatTimeStr(scheduledAt: Date | null): string | null {
  if (!scheduledAt) return null;
  const d = new Date(scheduledAt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function buildTemplateVars(data: {
  contactName: string | null;
  orgName: string | null;
  userName: string | null;
  scheduledAt: Date | null;
  totalGuests: number | null;
  clientGuests: number | null;
  ownGuests: number | null;
  venueName: string | null;
  venueAddress: string | null;
  mobile: string | null;
}): TemplateVars {
  return {
    contactName: data.contactName,
    orgName: data.orgName,
    userName: data.userName,
    dateStr: formatDateStr(data.scheduledAt),
    timeStr: formatTimeStr(data.scheduledAt),
    totalGuests: data.totalGuests,
    clientGuests: data.clientGuests,
    ownGuests: data.ownGuests,
    venueName: data.venueName,
    venueAddress: data.venueAddress,
    venueArea: extractArea(data.venueAddress),
    mobile: data.mobile,
  };
}

export function buildEmailTemplate(vars: TemplateVars): string {
  const dateTime = vars.dateStr
    ? vars.timeStr
      ? `${vars.dateStr} ${vars.timeStr}`
      : vars.dateStr
    : "［日付(曜) 開始時刻］";

  return [
    `${f(vars.contactName, "担当者名")}様`,
    `いつも大変お世話になっております。${f(vars.orgName, "自社名")}の${f(vars.userName, "あなたの氏名")}です。`,
    `お約束させていただいております会食の手配が整いましたので、以下の通りご案内いたします。`,
    ``,
    `■ 日時：${dateTime}`,
    `■ 人数：${f(vars.totalGuests, "合計人数")}名（貴社${f(vars.clientGuests, "人数")}名／当社${f(vars.ownGuests, "人数")}名）`,
    `■ 店名：${f(vars.venueName, "店名")}`,
    `■ 住所：${f(vars.venueAddress, "住所")}`,
    `■ アクセス：［最寄駅・出口］より徒歩［分数］分`,
    `■ 集合：［集合場所］に開始5分前`,
    `■ 当日連絡先：${f(vars.mobile, "携帯番号")}`,
    ``,
    `当日、お会いできることを楽しみにしております。`,
    `どうぞよろしくお願いいたします。`,
  ].join("\n");
}

export function buildSlackTemplate(vars: TemplateVars): string {
  const dateTime = vars.dateStr
    ? vars.timeStr
      ? `${vars.dateStr} ${vars.timeStr}`
      : vars.dateStr
    : "［日付(曜) 開始時刻］";

  return [
    `${f(vars.contactName, "担当者名")}さん`,
    `お世話になっております！`,
    `お約束させていただいておりますお食事について`,
    `${dateTime}、${f(vars.venueArea, "エリア")}で確定しました。`,
    ``,
    `店名：${f(vars.venueName, "店名")}`,
    `住所：${f(vars.venueAddress, "住所")}`,
    `アクセス：［最寄駅・出口］から徒歩［分数］分`,
    `集合：［集合場所］に開始5分前`,
    `当日連絡先：${f(vars.mobile, "携帯番号")}`,
    ``,
    `当日、楽しみにしております、よろしくお願いします！`,
  ].join("\n");
}
