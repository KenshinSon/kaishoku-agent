import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, mobile, ownerDepartureLocation, bio, isPublicProfile, dmEnabled } = await request.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name || null }),
      ...(mobile !== undefined && { mobile: mobile || null }),
      ...(ownerDepartureLocation !== undefined && { ownerDepartureLocation: ownerDepartureLocation || null }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(isPublicProfile !== undefined && { isPublicProfile }),
      ...(dmEnabled !== undefined && { dmEnabled }),
    },
  });

  return NextResponse.json({ ok: true });
}
