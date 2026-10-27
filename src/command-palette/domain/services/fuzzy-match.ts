export interface FuzzyMatch {
  score: number;
  indices: number[];
}

const CONSECUTIVE_BONUS = 6;
const WORD_START_BONUS = 8;
const PREFIX_BONUS = 4;
const GAP_PENALTY = 0.3;
const LEADING_GAP_PENALTY = 0.05;
const LENGTH_PENALTY = 0.01;
const NO_SCORE = Number.NEGATIVE_INFINITY;

function foldCharacter(character: string): string {
  return character.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function isWordStart(characters: string[], index: number): boolean {
  if (index === 0) return true;
  const previous = characters[index - 1];
  const current = characters[index];
  return !/[\p{L}\p{N}]/u.test(previous) || (previous === previous.toLowerCase() && current !== current.toLowerCase());
}

/** Returns where the query letters appear in order inside the text (best alignment), or null when they do not. */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const queryCharacters = Array.from(foldCharacter(query.replace(/\s+/g, "")));
  if (queryCharacters.length === 0) return { score: 0, indices: [] };

  const original = Array.from(text);
  const folded = original.map((character) => foldCharacter(character)[0] ?? character.toLowerCase());
  const textLength = folded.length;
  if (queryCharacters.length > textLength) return null;

  const baseScore = (queryIndex: number, textIndex: number) =>
    1 + (isWordStart(original, textIndex) ? WORD_START_BONUS : 0) + (queryIndex === 0 && textIndex === 0 ? PREFIX_BONUS : 0);

  // scores[i][j]: best score with query letter i matched at text position j; parents allow backtracking.
  const scores: number[][] = [];
  const parents: number[][] = [];

  for (let queryIndex = 0; queryIndex < queryCharacters.length; queryIndex++) {
    const rowScores = new Array<number>(textLength).fill(NO_SCORE);
    const rowParents = new Array<number>(textLength).fill(-1);
    let bestGap = NO_SCORE;
    let bestGapIndex = -1;

    for (let textIndex = 0; textIndex < textLength; textIndex++) {
      if (queryIndex > 0 && textIndex >= 2) {
        const candidate = scores[queryIndex - 1][textIndex - 2] + (textIndex - 2) * GAP_PENALTY;
        if (candidate > bestGap) {
          bestGap = candidate;
          bestGapIndex = textIndex - 2;
        }
      }
      if (folded[textIndex] !== queryCharacters[queryIndex]) continue;

      if (queryIndex === 0) {
        rowScores[textIndex] = baseScore(0, textIndex) - textIndex * LEADING_GAP_PENALTY;
        continue;
      }

      const previousScores = scores[queryIndex - 1];
      const consecutive = textIndex >= 1 ? previousScores[textIndex - 1] + CONSECUTIVE_BONUS : NO_SCORE;
      const afterGap = bestGap === NO_SCORE ? NO_SCORE : bestGap - (textIndex - 1) * GAP_PENALTY;

      if (consecutive === NO_SCORE && afterGap === NO_SCORE) continue;
      const useConsecutive = consecutive >= afterGap;
      rowScores[textIndex] = baseScore(queryIndex, textIndex) + (useConsecutive ? consecutive : afterGap);
      rowParents[textIndex] = useConsecutive ? textIndex - 1 : bestGapIndex;
    }
    scores.push(rowScores);
    parents.push(rowParents);
  }

  const lastRow = scores[queryCharacters.length - 1];
  let endIndex = -1;
  for (let textIndex = 0; textIndex < textLength; textIndex++) {
    if (lastRow[textIndex] !== NO_SCORE && (endIndex === -1 || lastRow[textIndex] > lastRow[endIndex])) endIndex = textIndex;
  }
  if (endIndex === -1) return null;

  const indices: number[] = [];
  for (let queryIndex = queryCharacters.length - 1, textIndex = endIndex; queryIndex >= 0; queryIndex--) {
    indices.unshift(textIndex);
    textIndex = parents[queryIndex][textIndex];
  }
  return { score: lastRow[endIndex] - textLength * LENGTH_PENALTY, indices };
}
