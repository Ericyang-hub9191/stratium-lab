import disagreeWithItself from "@/content/boosts/disagree-with-itself.json";
import letAiAdmitItDoesntKnow from "@/content/boosts/let-ai-admit-it-doesnt-know.json";
import rewriteThisWorse from "@/content/boosts/rewrite-this-worse.json";
import promptingFundamentals from "@/content/journeys/prompting-fundamentals.json";

// Base44 exit migration, step 1:
// keep static learning content readable from local JSON while auth,
// progress, stats, streaks, grading, and account data remain on Base44.
const BOOST_FILES = [
  disagreeWithItself,
  letAiAdmitItDoesntKnow,
  rewriteThisWorse,
];

const JOURNEY_FILES = [
  promptingFundamentals,
];

function stableId(record) {
  return record.id ?? record.slug;
}

function isVisible(record, includeUnpublished) {
  return includeUnpublished || record.isPublished === true;
}

function cloneRecord(record) {
  if (!record) return null;
  return {
    ...record,
    blocks: Array.isArray(record.blocks) ? [...record.blocks] : record.blocks,
    tags: Array.isArray(record.tags) ? [...record.tags] : record.tags,
    prerequisites: Array.isArray(record.prerequisites) ? [...record.prerequisites] : record.prerequisites,
  };
}

function normalizeBoost(boost) {
  return {
    ...boost,
    id: stableId(boost),
    slug: boost.slug ?? boost.id,
    estimatedMinutes: boost.estimatedMinutes ?? 4,
    xpReward: boost.xpReward ?? 40,
    tags: boost.tags ?? [],
    isPublished: boost.isPublished ?? false,
  };
}

function normalizeJourneyBundle(bundle) {
  const rawJourney = bundle.journey ?? bundle;
  const journeySlug = rawJourney.slug ?? rawJourney.id;
  const lessons = (bundle.lessons ?? []).map(lesson => normalizeLesson(lesson, journeySlug));
  const journey = {
    ...rawJourney,
    id: stableId(rawJourney),
    slug: journeySlug,
    totalLessons: rawJourney.totalLessons ?? lessons.length,
    prerequisites: rawJourney.prerequisites ?? [],
    tags: rawJourney.tags ?? [],
    isPublished: rawJourney.isPublished ?? false,
  };

  return { journey, lessons };
}

function normalizeLesson(lesson, journeySlug) {
  const journeyId = lesson.journeyId ?? journeySlug;
  return {
    ...lesson,
    id: stableId(lesson),
    slug: lesson.slug ?? lesson.id,
    journeyId,
    blocks: lesson.blocks ?? [],
    isPublished: lesson.isPublished ?? false,
  };
}

const boostRecords = BOOST_FILES.map(normalizeBoost);
const journeyBundles = JOURNEY_FILES.map(normalizeJourneyBundle);
const journeyRecords = journeyBundles.map(bundle => bundle.journey);
const lessonRecords = journeyBundles.flatMap(bundle => bundle.lessons);

function findBySlugOrId(records, slugOrId, includeUnpublished = false) {
  const needle = String(slugOrId ?? "");
  if (!needle) return null;
  const record = records.find(item => isVisible(item, includeUnpublished) && (item.id === needle || item.slug === needle));
  return cloneRecord(record);
}

export function listBoosts({ includeUnpublished = false } = {}) {
  return boostRecords
    .filter(boost => isVisible(boost, includeUnpublished))
    .map(cloneRecord);
}

export function getBoostBySlugOrId(slugOrId, { includeUnpublished = false } = {}) {
  return findBySlugOrId(boostRecords, slugOrId, includeUnpublished);
}

export function listJourneys({ includeUnpublished = false } = {}) {
  return journeyRecords
    .filter(journey => isVisible(journey, includeUnpublished))
    .map(cloneRecord);
}

export function getJourneyBySlugOrId(slugOrId, { includeUnpublished = false } = {}) {
  return findBySlugOrId(journeyRecords, slugOrId, includeUnpublished);
}

export function listLessons({ journeyId, includeUnpublished = false } = {}) {
  return lessonRecords
    .filter(lesson => isVisible(lesson, includeUnpublished))
    .filter(lesson => !journeyId || lesson.journeyId === journeyId)
    .map(cloneRecord);
}

export function getLessonBySlugOrId(slugOrId, { includeUnpublished = false } = {}) {
  return findBySlugOrId(lessonRecords, slugOrId, includeUnpublished);
}
