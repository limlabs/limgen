import { beforeEach, describe, test } from "node:test";
import assert from "node:assert";
import { detectFramework } from "@/framework";
import fs from "node:fs/promises";
import { fileExists } from "@/files";

describe("tanstack", async () => {
  await fs.mkdir('test/output/framework', { recursive: true });
  process.chdir('test/output/framework');

  beforeEach(async () => {
    if (await fileExists('package.json')) {
      await fs.rm('package.json');
    }
  });

  test('should detect nextjs framework', async () => {
    await fs.writeFile('package.json', JSON.stringify({
      dependencies: {
        next: 'latest',
      },
    }));

    const detectedFramework = await detectFramework();
    assert.strictEqual(detectedFramework, 'nextjs');
  });

  test('should detect tanstack-start framework', async () => {
    await fs.writeFile('package.json', JSON.stringify({
      dependencies: {
        '@tanstack/start': 'latest',
      },
    }));

    const detectedFramework = await detectFramework();
    assert.strictEqual(detectedFramework, 'tanstack-start');
  });
});