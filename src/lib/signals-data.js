import { base44 } from "@/api/base44Client";

export async function fetchAllSignals() {
  return base44.entities.Signal.list("-date", 100);
}

export async function fetchTodaySignal() {
  const today = new Date().toISOString().split("T")[0];
  const results = await base44.entities.Signal.filter({ date: today });
  if (results[0]) return results[0];
  const fallback = await base44.entities.Signal.list("-date", 1);
  return fallback[0] ?? null;
}

export async function fetchSignalsGroupedByMonth() {
  const signals = await fetchAllSignals();
  const groups = {};
  signals.forEach(signal => {
    const [year, month] = signal.date.split("-");
    const key = `${year}-${month}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(signal);
  });
  Object.keys(groups).forEach(k => groups[k].sort((a, b) => b.date.localeCompare(a.date)));
  return groups;
}