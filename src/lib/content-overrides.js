import disagreeWithItself from "@/content/boosts/disagree-with-itself.json";
import letAiAdmitItDoesntKnow from "@/content/boosts/let-ai-admit-it-doesnt-know.json";
import rewriteThisWorse from "@/content/boosts/rewrite-this-worse.json";

const CANONICAL_BOOSTS = [
  disagreeWithItself,
  letAiAdmitItDoesntKnow,
  rewriteThisWorse,
];

const canonicalBySlug = new Map(CANONICAL_BOOSTS.map(boost => [boost.slug, boost]));
const canonicalByTitle = new Map(CANONICAL_BOOSTS.map(boost => [boost.title, boost]));
const canonicalByTitleAlias = new Map([
  ["Rewrite this, worse", rewriteThisWorse],
  ["Make it disagree with itself", disagreeWithItself],
  ["Let AI admit it doesn't know", letAiAdmitItDoesntKnow],
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
