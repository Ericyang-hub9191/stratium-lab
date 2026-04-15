import { base44 } from "@/api/base44Client";

export async function updateStreak(userId) {
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const [existing] = await base44.entities.Streak.filter({ userId });
  if (existing) {
    if (existing.lastCompletedDate === today) return;
    const consecutive = existing.lastCompletedDate === yesterday;
    const newStreak   = consecutive ? (existing.currentStreak ?? 0) + 1 : 1;
    await base44.entities.Streak.update(existing.id, {
      currentStreak:     newStreak,
      longestStreak:     Math.max(existing.longestStreak ?? 0, newStreak),
      lastCompletedDate: today,
      totalWins:         (existing.totalWins ?? 0) + 1,
    });
  } else {
    await base44.entities.Streak.create({
      userId, currentStreak: 1, longestStreak: 1,
      lastCompletedDate: today, totalWins: 1, freezeCount: 3,
    });
  }
}

export async function updateUserStats(userId, xpEarned) {
  const [existing] = await base44.entities.UserStats.filter({ userId });
  if (existing) {
    const newXp = (existing.totalXp ?? 0) + xpEarned;
    await base44.entities.UserStats.update(existing.id, {
      totalXp:                newXp,
      currentLevel:           Math.floor(newXp / 500) + 1,
      totalMissionsCompleted: (existing.totalMissionsCompleted ?? 0) + 1,
    });
  } else {
    await base44.entities.UserStats.create({
      userId, totalXp: xpEarned, currentLevel: 1,
      totalMissionsCompleted: 1, totalTimeSaved: 0, badges: [],
    });
  }
}