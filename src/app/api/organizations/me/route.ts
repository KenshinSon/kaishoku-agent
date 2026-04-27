import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, address, industry, nearestStation, websiteUrl } = await request.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (user?.organizationId) {
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        ...(name !== undefined && { name: name || "個人" }),
        ...(address !== undefined && { address: address || null }),
        ...(industry !== undefined && { industry: industry || null }),
        ...(nearestStation !== undefined && { nearestStation: nearestStation || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
      },
    });
  } else {
    const org = await prisma.organization.create({
      data: {
        name: name || "個人",
        address: address || null,
        industry: industry || null,
        nearestStation: nearestStation || null,
        websiteUrl: websiteUrl || null,
      },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { organizationId: org.id },
    });
  }

  return NextResponse.json({ ok: true });
}
