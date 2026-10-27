import { describe, expect, it } from "vitest";
import { detectDelimiter, parseCsv } from "./parse-csv";

describe("parseCsv", () => {
  it("splits rows and fields", () => {
    expect(parseCsv("a,b,c\n1,2,3\n", ",")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("supports CRLF and lone CR line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r3,4", ",")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("keeps delimiters, quotes and line breaks inside quoted fields", () => {
    expect(parseCsv('name,notes\n"Doe, Jane","said ""hi""\nthen left"', ",")).toEqual([
      ["name", "notes"],
      ["Doe, Jane", 'said "hi"\nthen left'],
    ]);
  });

  it("keeps empty fields and does not add a row for a trailing newline", () => {
    expect(parseCsv("a,,c\n,,\n", ",")).toEqual([
      ["a", "", "c"],
      ["", "", ""],
    ]);
  });

  it("removes a byte order mark", () => {
    expect(parseCsv("﻿id,name\n1,x", ",")[0]).toEqual(["id", "name"]);
  });

  it("returns no rows for an empty file", () => {
    expect(parseCsv("", ",")).toEqual([]);
  });
});

describe("detectDelimiter", () => {
  it.each([
    ["a,b,c\n1,2,3", ","],
    ["a;b;c\n1;2;3", ";"],
    ["a\tb\tc", "\t"],
    ["a|b|c", "|"],
    ['"a,b";c;d', ";"],
    ["single", ","],
  ])("detects the delimiter of %j", (source, expected) => {
    expect(detectDelimiter(source)).toBe(expected);
  });
});
