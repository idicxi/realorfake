import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({
      ok: true,
      stats: { accuracy: 0, winStreak: 0, totalRounds: 0 },
    });
  }

  const stats = await prisma.playerStats.findUnique({
    where: { userId: session.user.id },
    select: { accuracy: true, winStreak: true, totalRounds: true },
  });

  return NextResponse.json({
    ok: true,
    stats: stats ?? { accuracy: 0, winStreak: 0, totalRounds: 0 },
  });
}

