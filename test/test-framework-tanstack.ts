import { beforeEach, describe, test } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import tanstackStartFramework, { collectInput, inputs } from "@/frameworks/tanstack-start/framework";
import { fileExists } from "@/files";

describe("tanstack", async () => {
  await fs.mkdir('test/output/frameworks/tanstack-start', { recursive: true });  
  process.chdir('test/output/frameworks/tanstack-start');

  beforeEach(async () => {
    if (await fileExists('Dockerfile')) {
      await fs.rm('Dockerfile');
    }

    if (await fileExists('.dockerignore')) {
      await fs.rm('.dockerignore');
    }

    await fs.writeFile('app.config.ts', `import { defineConfig } from '@tanstack/start/config'\n\nexport default defineConfig({})`);
  });

  test('should copy Dockerfile', async () => {
    await tanstackStartFramework({})

    assert.ok(await fileExists('Dockerfile'));
  });

  test('should modify app.config.ts', async () => {
    await tanstackStartFramework({})

    const content = await fs.readFile('app.config.ts', 'utf-8');
    assert.ok(content.includes("preset: 'node-server"));
  });

  test('should copy .dockerignore', async () => {
    await tanstackStartFramework({})

    assert.ok(await fileExists('.dockerignore'));
  });

  test('should modify existing .dockerignore', async () => {
    await fs.writeFile('.dockerignore', 'custom\n');

    await tanstackStartFramework({})

    const content = await fs.readFile('.dockerignore', 'utf-8');
    assert.ok(content.includes('custom'));
    assert.ok(content.includes('.output'));
  });


  test('should throw error if configured for a non-supported preset', async () => {
    await fs.writeFile('app.config.ts', `import { defineConfig } from '@tanstack/start/config'\n\nexport default defineConfig({ server: { preset: 'express' } })`);

    try {
      await tanstackStartFramework({
        port: 3000,
      });
      assert.fail('Expected error to be thrown');
    } catch (error: any) {
      assert.ok(error.message.includes('Limgen support for Tanstack start is limited to the node-server preset'));
    }
  });

  test('should return input definition', async () => {
    const result = await inputs({}, {});

    assert.deepStrictEqual(result, []);
  });

  test('should collect inputs to pass to framework function', async () => {
    const result = await collectInput({}, {}, {});

    assert.deepStrictEqual(result, {});
  });
});