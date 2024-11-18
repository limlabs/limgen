import { cliBoolean } from "@/schema";
import { describe, test } from "node:test";
import assert from "node:assert";

describe("cliBoolean schema", () => {
  const schema = cliBoolean();

  test("should transform 'true' to 'true'", () => {
    const result = schema.parse('true');
    assert.strictEqual(result, 'true');
  });

  test("should transform 'false' to 'false'", () => {
    const result = schema.parse('false');
    assert.strictEqual(result, 'false');
  });

  test("should transform 'unknown' to 'unknown'", () => {
    const result = schema.parse('unknown');
    assert.strictEqual(result, 'unknown');
  });

  test("should throw an error for invalid values", () => {
    assert.throws(() => schema.parse('invalid'));
  });
});