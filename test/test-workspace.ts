import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import { initWorkspace, generateTSConfig, generatePackageJSON } from '@/workspace';

describe('workspace', async () => {
  
  await fs.mkdir('test/output/workspace', { recursive: true });
  process.chdir('test/output/workspace');

  test('should initialize a new workspace', async () => {
    await initWorkspace();
    const dir = await fs.readdir('.');
    assert.ok(dir.includes('infrastructure'));
  });

  test('should generate a tsconfig file', async () => {
    await initWorkspace();
    await generateTSConfig();
    // Check if tsconfig.json exists
    const dir = await fs.readdir('infrastructure');
    assert.ok(dir.includes('tsconfig.json'));
  });

  test('should generate a package.json file', async () => {
    await initWorkspace();
    await generatePackageJSON();
    // Check if package.json exists
    const dir = await fs.readdir('infrastructure');
    assert.ok(dir.includes('package.json'));
  });
})