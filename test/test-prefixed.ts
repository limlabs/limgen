import { describe, test } from "node:test";
import assert from "node:assert";
import { prefixed } from "@/utils/prefixed";

describe('prefixed', () => {
  test('should return a string with the project and stack name', () => {
    const result = prefixed('my-resource');
    assert.equal(result, 'project-stack-my-resource');
  });

  test('should return a string with the project and stack name and a hash', () => {
    let result = prefixed('my-resource', 10);
    assert.equal(result, "proj239dc0");
    assert.equal(result.length, 10);

    result = prefixed('my-resource', 15);
    assert.equal(result, "project-s239dc0");

    result = prefixed('my-resource', 20);
    assert.equal(result, "project-stack-239dc0");

    result = prefixed('my-resource', 34);
    assert.equal(result, "project-stack-my-resource");

  });

});