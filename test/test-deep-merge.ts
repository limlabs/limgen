import { describe, test } from 'node:test'
import { deepMerge } from '@/utils/deep-merge';
import assert from 'node:assert';

describe('deepMerge', () => {
  test('should deeply merge two objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  test('should concatenate arrays', () => {
    const target = [1, 2, 3];
    const source = [4, 5, 6];
    const result = deepMerge(target, source);
    assert.deepEqual(result, [1, 2, 3, 4, 5, 6]);
  });

  test('should handle nested objects and arrays', () => {
    const target = { a: { b: [1, 2] } };
    const source = { a: { b: [3, 4], c: 5 } };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: { b: [3, 4], c: 5 } });
  });

  test('should overwrite primitive values', () => {
    const target = { a: 1, b: 2 };
    const source = { a: 3, c: 4 };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: 3, b: 2, c: 4 });
  });

  test('should handle non-object and non-array values', () => {
    const target = 1;
    const source = { a: 2 };
    const result = deepMerge(target, source);
    assert.deepEqual(result, 1);
  });

  test('should handle null and undefined values', () => {
    const target = { a: null };
    const source = { a: { b: 1 } };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: { b: 1 } });

    const target2 = { a: undefined };
    const source2 = { a: { b: 1 } };
    const result2 = deepMerge(target2, source2);
    assert.deepEqual(result2, { a: { b: 1 } });
  });
});