import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildEmailTemplate, buildSlackTemplate, buildTemplateVars } from "@/lib/template";
import TemplateEditor from "./_components/TemplateEditor";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const [diningRequest, user, selectedRecVenue] = await Promise.all([
    prisma.diningRequest.findUnique({
      where: { id, userId: session!.user.id },
      include: { contact: true },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      include: { organization: true },
    }),
    prisma.recommendationVenue.findFirst({
      where: {
        isSelected: true,
        recommendation: { diningRequestId: id },
      },
      include: { venue: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!diningRequest) notFound();

  const vars = buildTemplateVars({
    contactName: diningRequest.contact?.name ?? null,
    orgName: user?.organization?.name ?? null,
    userName: user?.name ?? null,
    scheduledAt: diningRequest.scheduledAt,
    totalGuests: diningRequest.totalGuests,
    clientGuests: diningRequest.clientGuests,
    ownGuests: diningRequest.ownGuests,
    venueName: selectedRecVenue?.venue.name ?? null,
    venueAddress: selectedRecVenue?.venue.address ?? null,
    mobile: user?.mobile ?? null,
  });

  const emailTemplate = buildEmailTemplate(vars);
  const slackTemplate = buildSlackTemplate(vars);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/requests/${id}/recommendations`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← 提案を見る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">確定連絡テンプレート</h1>
        {diningRequest.contact && (
          <p className="text-sm text-gray-500 mt-1">
            {diningRequest.contact.companyName}{" "}
            {diningRequest.contact.name}
            {diningRequest.contact.title && `（${diningRequest.contact.title}）`}
            との会食
          </p>
        )}
      </div>

      {!selectedRecVenue && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          まだ店舗が確定されていません。提案ページで「この店にする」を選択してください。
        </div>
      )}

      <TemplateEditor emailTemplate={emailTemplate} slackTemplate={slackTemplate} />
    </div>
  );
}
