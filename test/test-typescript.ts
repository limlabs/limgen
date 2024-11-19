import { extractImports } from "@/typescript";
import { describe, it } from "node:test";
import assert = require("node:assert");

describe('extractImports', () => {
  it('should extract named imports', () => {
    const code = `import { a, b } from 'module1';`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['module1']);
  });

  it('should extract default imports', () => {
    const code = `import a from 'module2';`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['module2']);
  });

  it('should extract namespace imports', () => {
    const code = `import * as ns from 'module3';`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['module3']);
  });

  it('should extract mixed imports', () => {
    const code = `import a, { b, c } from 'module4';`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['module4']);
  });

  it('should extract multiple imports', () => {
    const code = `
      import { a, b } from 'module1';
      import c from 'module2';
      import * as ns from 'module3';
      import d, { e, f } from 'module4';
    `;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['module1', 'module2', 'module3', 'module4']);
  });

  it('should handle no imports', () => {
    const code = `const a = 1;`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, []);
  });

  it('should handle double quotes', () => {
    const code = `import { a } from "module1";`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['module1']);
  });

  it('should exclude relative imports', () => {
    const code = `import { a } from './module1';`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, []);
  });

  it('should handle organization prefixes', () => {
    const code = `import { a } from '@org/module1';`;
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['@org/module1']);
  });

  it('should handle multiple organization prefixes', () => {
    const code = 'import * as pulumi from "@pulumi/pulumi";';
    const result = extractImports(code);
    assert.deepStrictEqual(result, ['@pulumi/pulumi']);
  });
});