import { beforeEach, describe, test } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import { dockerfileExists, getDockerfilePort } from '@/docker';

describe('docker', async () => {
  await fs.mkdir('test/output/docker', { recursive: true });
  process.chdir('test/output/docker');

  beforeEach(async () => {
    await fs.rm('Dockerfile', { recursive: true, force: true });
  });

  test('should return true if Dockerfile exists', async () => {
    await fs.writeFile('Dockerfile', '');
    assert.strictEqual(await dockerfileExists(), true);
  });

  test('should return false if Dockerfile does not exist', async () => {
    assert.strictEqual(await dockerfileExists(), false);
  });

  test('should return the port from the Dockerfile', async () => {
    await fs.writeFile('Dockerfile', 'EXPOSE 3000');
    assert.strictEqual(await getDockerfilePort(), 3000);
  });

  test('should return null if the Dockerfile does not contain an EXPOSE directive', async () => {
    await fs.writeFile('Dockerfile', '');
    assert.strictEqual(await getDockerfilePort(), null);
  });
})