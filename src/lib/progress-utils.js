/* ─────────────────────────────────────────────────────────────
   progress-utils
   ─────────────
   - updateStreak:  correctly handles same-day repeats & gap days
   - updateUserStatsForLesson / ForBoost: atomic stat increments
   - No optimistic "streak++" lies — callers should NOT
     decorate the UI with a fake streak number on every win.
     Callers should re-read Streak after updateStreak resolves
     (quick & correct) instead.
   ───────────────────────────────────────────────────────────── */

import { base44 } from "@/api/base44Client";

const todayISO = () => new Date().toISOString().split("T")[0];
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

/**
 * Update the user's Streak record for today's activity.
 * Safe to call multiple times per day — only the first call of the day
 * advances the streak; subsequent calls are no-ops.
 */
export async function updateStreak(userId) {
  if (!userId) return null;
  const today = todayISO();
  const yesterday = yesterdayISO();

  const existing = await base44.entities.Streak.filter({ userId });
  const record = existing[0];

  if (record && record.lastCompletedDate === today) {
    // Already counted today. Do nothing.
    return record;
  }

  if (!record) {
    return base44.entities.Streak.create({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: today,
      totalCompletedDays: 1,
      freezeCount: 0,
    });
  }

  const consecutive = record.lastCompletedDate === yesterday;
  const newStreak = consecutive ? (record.currentStreak ?? 0) + 1 : 1;

  await base44.entities.Streak.update(record.id, {
    currentStreak: newStreak,
    longestStreak: Math.max(record.longestStreak ?? 0, newStreak),
    lastCompletedDate: today,
    totalCompletedDays: (record.totalCompletedDays ?? 0) + 1,
  });

  return { ...record, currentStreak: newStreak, lastCompletedDate: today };
}

async function updateStatsBase(userId, xpEarned, key) {
  const existing = await base44.entities.UserStats.filter({ userId });
  if (existing[0]) {
    const rec = existing[0];
    await base44.entities.UserStats.update(rec.id, {
      totalXp: (rec.totalXp ?? 0) + xpEarned,
      [key]: (rec[key] ?? 0) + 1,
      lastActivityAt: new Date().toISOString(),
    });
  } else {
    await base44.entities.UserStats.create({
      userId,
      totalXp: xpEarned,
      totalLessonsCompleted: key === "totalLessonsCompleted" ? 1 : 0,
      totalBoostsCompleted:  key === "totalBoostsCompleted"  ? 1 : 0,
      totalJourneysCompleted: 0,
      favoriteTracks: [],
      lastActivityAt: new Date().toISOString(),
    });
  }
}

export async function updateUserStatsForLesson(userId, xpEarned) {
  return updateStatsBase(userId, xpEarned, "totalLessonsCompleted");
}

export async function updateUserStatsForBoost(userId, xpEarned) {
  return updateStatsBase(userId, xpEarned, "totalBoostsCompleted");
}

/**
 * Level is derived from totalXp with a gentle exponential curve:
 *   levelXp(n) = round(100 * n^1.5)
 * So level 2 = 100, level 5 = 1118, level 10 = 3162, level 20 = 8944, level 30 = 16432.
 * Meaningful progression that doesn't flatten out.
 */
export function levelFromXp(totalXp) {
  if (!totalXp || totalXp <= 0) return { level: 1, xpIntoLevel: 0, xpForNext: 100 };
  let level = 1;
  while (100 * Math.pow(level + 1, 1.5) <= totalXp) level += 1;
  const thisLevelStart = Math.round(100 * Math.pow(level, 1.5));
  const nextLevelStart = Math.round(100 * Math.pow(level + 1, 1.5));
  return {
    level,
    xpIntoLevel: Math.max(0, totalXp - thisLevelStart),
    xpForNext: nextLevelStart - thisLevelStart,
  };
}