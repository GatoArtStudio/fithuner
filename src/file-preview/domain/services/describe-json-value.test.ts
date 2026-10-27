import { describe, expect, it } from "vitest";
import { describeJsonContainer, jsonChildren, jsonKindOf } from "./describe-json-value";

describe("json value helpers", () => {
  it.each([
    [null, "null"],
    [[1], "array"],
    [{ a: 1 }, "object"],
    ["text", "string"],
    [3, "number"],
    [false, "boolean"],
  ])("classifies %j as %s", (value, kind) => {
    expect(jsonKindOf(value)).toBe(kind);
  });

  it("lists children of arrays and objects, and none for scalars", () => {
    expect(jsonChildren(["x", "y"])).toEqual([["0", "x"], ["1", "y"]]);
    expect(jsonChildren({ a: 1 })).toEqual([["a", 1]]);
    expect(jsonChildren(5)).toEqual([]);
  });

  it("summarizes containers by their size", () => {
    expect(describeJsonContainer([1, 2, 3])).toBe("[3]");
    expect(describeJsonContainer({ a: 1, b: 2 })).toBe("{2}");
  });
});
