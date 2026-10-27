import { normalizeForSearch } from "./normalize-for-search";

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/** Splits a name into segments, flagging the characters that matched any word of the query. */
export function highlightSegments(name: string, query: string): HighlightSegment[] {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  const characters = Array.from(name);
  if (terms.length === 0 || characters.length === 0) return [{ text: name, isMatch: false }];

  let folded = "";
  const originalIndexOfFolded: number[] = [];
  characters.forEach((character, index) => {
    const foldedCharacter = normalizeForSearch(character);
    for (let unit = 0; unit < foldedCharacter.length; unit++) originalIndexOfFolded.push(index);
    folded += foldedCharacter;
  });

  const isMatched = new Array<boolean>(characters.length).fill(false);
  for (const term of terms) {
    let from = 0;
    for (let found = folded.indexOf(term, from); found !== -1; found = folded.indexOf(term, from)) {
      for (let offset = 0; offset < term.length; offset++) {
        isMatched[originalIndexOfFolded[found + offset]] = true;
      }
      from = found + 1;
    }
  }

  const segments: HighlightSegment[] = [];
  characters.forEach((character, index) => {
    const last = segments[segments.length - 1];
    if (last && last.isMatch === isMatched[index]) last.text += character;
    else segments.push({ text: character, isMatch: isMatched[index] });
  });
  return segments;
}
