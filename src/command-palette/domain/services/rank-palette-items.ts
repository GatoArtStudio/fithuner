import { GROUP_ORDER, type PaletteItem, type RankedPaletteItem } from "../entities/palette-item";
import { fuzzyMatch } from "./fuzzy-match";

export const PALETTE_RESULT_LIMIT = 50;
const KEYWORD_WEIGHT = 0.7;

interface Scored {
  ranked: RankedPaletteItem;
  score: number;
  order: number;
}

function scoreItem(item: PaletteItem, query: string): { score: number; titleIndices: number[] } | null {
  const titleMatch = fuzzyMatch(query, item.title);
  const keywordScore = (item.keywords ?? [])
    .map((keyword) => fuzzyMatch(query, keyword)?.score)
    .filter((score): score is number => score !== undefined)
    .reduce<number | null>((best, score) => (best === null || score > best ? score : best), null);

  if (titleMatch) return { score: titleMatch.score, titleIndices: titleMatch.indices };
  if (keywordScore !== null) return { score: keywordScore * KEYWORD_WEIGHT, titleIndices: [] };
  return null;
}

export function rankPaletteItems(items: PaletteItem[], query: string, limit = PALETTE_RESULT_LIMIT): RankedPaletteItem[] {
  const text = query.trim();
  const scored: Scored[] = [];

  items.forEach((item, order) => {
    if (text === "") {
      if (!item.alwaysVisible) scored.push({ ranked: { item, titleIndices: [] }, score: 0, order });
      return;
    }
    const result = scoreItem(item, text);
    if (result) scored.push({ ranked: { item, titleIndices: result.titleIndices }, score: result.score, order });
    else if (item.alwaysVisible) scored.push({ ranked: { item, titleIndices: [] }, score: 0, order });
  });

  return scored
    .sort((first, second) => {
      const byGroup = GROUP_ORDER.indexOf(first.ranked.item.group) - GROUP_ORDER.indexOf(second.ranked.item.group);
      if (byGroup !== 0) return byGroup;
      return second.score - first.score || first.order - second.order;
    })
    .slice(0, limit)
    .map(({ ranked }) => ranked);
}
