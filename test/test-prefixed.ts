import { describe, test, mock } from "node:test";
import assert from "node:assert";
import { prefixed } from "@/utils/prefixed";

describe('prefixed', () => {
  test('should return a string with the project and stack name', () => {
    const result = prefixed('my-resource');
    assert.equal(result, 'project-stack-my-resource');
  });
});