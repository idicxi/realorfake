import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import ProfileClient from "@/app/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, stats: true },
  });
  if (!user) redirect("/login");

  const [userAchievements, allAchievementDefs] = await Promise.all([
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { achievement: true },
    }),
    prisma.achievement.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, title: true, description: true, icon: true },
    }),
  ]);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const lockedAchievements = allAchievementDefs.filter((a) => !unlockedIds.has(a.id));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <ProfileClient
        name={user.name}
        image={user.image}
        stats={{
          accuracy: user.stats?.accuracy ?? 0,
          winStreak: user.stats?.winStreak ?? 0,
          totalRounds: user.stats?.totalRounds ?? 0,
        }}
        achievements={userAchievements.map((ua) => ({
          id: ua.achievementId,
          title: ua.achievement.title,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          createdAt: ua.createdAt.toISOString(),
        }))}
        lockedAchievements={lockedAchievements.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
        }))}
      />
    </main>
  );
}
