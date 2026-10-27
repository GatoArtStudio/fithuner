const CANDIDATE_DELIMITERS = [",", ";", "\t", "|"];

export function parseCsv(source: string, delimiter: string): string[][] {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let isQuoted = false;
  let index = 0;

  function endField() {
    row.push(field);
    field = "";
  }

  function endRow() {
    endField();
    rows.push(row);
    row = [];
  }

  while (index < text.length) {
    const character = text[index];
    if (isQuoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        isQuoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field === "") {
      isQuoted = true;
    } else if (character === delimiter) {
      endField();
    } else if (character === "\r") {
      if (text[index + 1] === "\n") index++;
      endRow();
    } else if (character === "\n") {
      endRow();
    } else {
      field += character;
    }
    index++;
  }

  if (field !== "" || row.length > 0) endRow();
  return rows;
}

export function detectDelimiter(source: string): string {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  let bestDelimiter = ",";
  let bestCount = 0;

  for (const delimiter of CANDIDATE_DELIMITERS) {
    let count = 0;
    let isQuoted = false;
    for (const character of firstLine) {
      if (character === '"') isQuoted = !isQuoted;
      else if (character === delimiter && !isQuoted) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = delimiter;
    }
  }
  return bestDelimiter;
}
