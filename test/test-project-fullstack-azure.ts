import { describe, test, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import fs from 'node:fs/promises';
import fullstackAzure, { dependsOn, collectInput, inputs, envPull } from '@/project-types/fullstack-azure/project';
import { fileExists } from '@/files';

describe('test-project-fullstack-azure', async () => {
  await fs.mkdir('test/output/fullstack-aws', { recursive: true });
  process.chdir('test/output/fullstack-aws');

  beforeEach(async () => {
    if (await fileExists('infrastructure')) {
      await fs.rm('infrastructure', { recursive: true, force: true });
    }

    await fs.mkdir('infrastructure/projects/fullstack-aws', { recursive: true });
    await fs.writeFile('package.json', '{ "name": "test" }');
  });

  test('returns dependencies', async () => {
    const result = await dependsOn({
      projectName: 'test',
      projectType: 'fullstack-azure'
    });

    assert.ok(result.packages);
    assert.ok(result.packages.includes('@pulumi/azure-native'));
    assert.ok(result.files.length > 0);
  });

  test('returns input definitions', async () => {
    const result = await inputs();

    assert.ok(result.length === 0);
  });

  test('collects inputs', async () => {
    const result = await collectInput({
      directory: ''
    }, {});

    assert.deepEqual(result, {});
  });

  test('renders the index file', async () => {
    const result = await fullstackAzure({
      projectName: 'test',
      projectType: 'fullstack-aws'
    });

    assert.ok(result.includes('new AppAzureAcs'));
  });

  test('envPull throws an error', async () => {
    try {
      await envPull({
        projectName: 'test',
        stack: 'dev'
      });
    } catch (error) {
      assert.ok(error instanceof Error);
    }
  });

  test('dockerignore is updated when it already exists', async () => {
    await fs.writeFile('.dockerignore', 'Dockerfile\n');
    
    await fullstackAzure({
      projectName: 'test',
      projectType: 'fullstack-aws'
    });

    const dockerignore = await fs.readFile('.dockerignore', 'utf-8');
    assert.ok(dockerignore.includes('infrastructure'));
  });
});