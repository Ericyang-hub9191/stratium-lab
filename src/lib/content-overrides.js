import { getBoostBySlugOrId, listBoosts } from "@/lib/content-adapter";

const CANONICAL_BOOSTS = listBoosts();

const canonicalBySlug = new Map(CANONICAL_BOOSTS.map(boost => [boost.slug, boost]));
const canonicalByTitle = new Map(CANONICAL_BOOSTS.map(boost => [boost.title, boost]));
const canonicalByTitleAlias = new Map([
  ["Rewrite this, worse", getBoostBySlugOrId("the-rewrite-this-worse-trick")],
  ["Make it disagree with itself", getBoostBySlugOrId("force-the-model-to-disagree")],
  ["Let AI admit it doesn't know", getBoostBySlugOrId("let-ai-admit-it-doesnt-know")],
]);

function hasReviewContent(review) {
  return review && Array.isArray(review.questions) && review.questions.length > 0;
}

export function applyBoostContentOverrides(boost) {
  if (!boost) return boost;
  const canonical = canonicalBySlug.get(boost.slug) || canonicalByTitle.get(boost.title) || canonicalByTitleAlias.get(boost.title);
  if (!canonical) return boost;

  return {
    ...boost,
    review: hasReviewContent(boost.review) ? boost.review : canonical.review,
    blocks: Array.isArray(boost.blocks) && boost.blocks.length > 0 ? boost.blocks : canonical.blocks,
    subtitle: boost.subtitle ?? canonical.subtitle,
    tags: Array.isArray(boost.tags) && boost.tags.length > 0 ? boost.tags : canonical.tags,
  };
}

export function applyBoostListContentOverrides(boosts = []) {
  return boosts.map(applyBoostContentOverrides);
}
