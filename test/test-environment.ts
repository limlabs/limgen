import { describe, test, beforeEach } from "node:test";
import assert from "assert";
import fs from 'fs/promises';
import { usesEnvironmentVariable } from '../src/environment';

describe('environment utils', async () => {
  await fs.mkdir('test/output/environment', { recursive: true });
  process.chdir('test/output/environment');

  beforeEach(async () => { 
    const files = await fs.readdir(process.cwd());
    for (const file of files) {
      await fs.rm(file, { force: true, recursive: true });
    }
  });

  test('usesEnvironmentVariable reads from ts files', async () => {
    await fs.writeFile('index.ts', `
      import { DATABASE_URL } from './config';
      console.log(DATABASE_URL);
    `, 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });

  test('usesEnvironmentVariable reads from js files', async () => {
    await fs.writeFile('index.js', `
      const { DATABASE_URL } = require('./config');
      console.log(DATABASE_URL);
    `, 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });

  test('usesEnvironmentVariable reads from json files', async () => {
    await fs.writeFile('index.json', `
      {
        "DATABASE_URL": "postgres://localhost:5432/mydb"
      }
    `, 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });

  test('usesEnvironmentVariable reads from prisma.schema files', async () => {
    await fs.writeFile('prisma.schema', `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }
    `, 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });

  test('usesEnvironmentVariable reads from Dockerfile files', async () => {
    await fs.writeFile('Dockerfile', `
      FROM node:14
      ENV DATABASE_URL postgres://localhost:5432/mydb
    `, 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });

  test('usesEnvironmentVariable returns false when the environment variable is not used', async () => {
    await fs.writeFile('index.ts', `
      console.log('Hello, world!');
    `, 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, false);
  });

  test('usesEnvironmentVariable includes files not listed in .gitignore', async () => {
    await fs.writeFile('.gitignore', `
      node_modules
      .env
    `, 'utf-8');

    await fs.writeFile('index.ts', 'import { DATABASE_URL } from "./config";', 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });

  test('usesEnvironmentVariable excludes files listed in .gitignore', async () => {
    await fs.writeFile('.gitignore', `
      node_modules
      .env
      index.ts
    `, 'utf-8');

    await fs.writeFile('index.ts', 'import { DATABASE_URL } from "./config";', 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, false);
  });

  test('usesEnvironmentVariable looks in nested directories', async () => {
    await fs.mkdir('src');
    await fs.writeFile('src/index.ts', 'import { DATABASE_URL } from "./config";', 'utf-8');

    const result = await usesEnvironmentVariable('DATABASE_URL');
    assert.strictEqual(result, true);
  });
})