import { describe, test, beforeEach } from "node:test";
import fs from 'fs/promises';
import assert from "assert";
import { hasDependency } from "@/npm";

describe('npm utils', async () => {
  await fs.mkdir('test/output/npm', { recursive: true });
  process.chdir('test/output/npm');

  beforeEach(async () => {
    const files = await fs.readdir(process.cwd());
    for (const file of files) {
      await fs.rm(file, { force: true, recursive: true });
    }
  });

  test('hasDependency returns true if the dependency is in package.json', async () => {
    await fs.writeFile('package.json', `
      {
        "dependencies": {
          "express": "^4.17.1"
        }
      }
    `, 'utf-8');

    const result = await hasDependency('express');
    assert.strictEqual(result, true);
  });

  test('hasDependency returns false if the dependency is not in package.json', async () => {
    await fs.writeFile('package.json', `
      {
        "dependencies": {
          "express": "^4.17.1"
        }
      }
    `, 'utf-8');

    const result = await hasDependency('react');
    assert.strictEqual(result, false);
  });

  test('hasDependency returns true if the devDependency is in package.json', async () => {
    await fs.writeFile('package.json', `
      {
        "devDependencies": {
          "jest": "^27.0.6"
        }
      }
    `, 'utf-8');

    const result = await hasDependency('jest');
    assert.strictEqual(result, true);
  });

  test('hasDependency returns false if the devDependency is not in package.json', async () => {
    await fs.writeFile('package.json', `
      {
        "devDependencies": {
          "jest": "^27.0.6"
        }
      }
    `, 'utf-8');

    const result = await hasDependency('mocha');
    assert.strictEqual(result, false);
  });
});
