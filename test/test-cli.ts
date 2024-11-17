import test, { describe } from "node:test";

import { cli } from "@/cli";
import fs from 'fs/promises';
import assert from "node:assert";

describe('cli', async () => {
  await fs.mkdir('test/output', { recursive: true });
  process.chdir('test/output');

  test('cli prompts for component name', async (t) => {
    // mock process
    const mockInputs = ['nextjs-blog', '', ''];
    let currentInput = 0;
    // mock process
    global.process = {
      argv: ['node', 'cli'],
      stdin: {
        once: (event: string, cb: (data: string) => void) => {
          cb(mockInputs[currentInput++]);
        },
      },
    } as any;

    // run the cli
    await cli();

    // validate that the index.ts file was created
    await fs.stat('infrastructure/index.ts');
    await fs.stat('infrastructure/components');
    await fs.stat('infrastructure/Pulumi.yaml');

    // validate the Pulumi.yaml contents are correct
    const pulumiYaml = await fs.readFile('infrastructure/Pulumi.yaml', 'utf-8');
    assert(pulumiYaml.includes('name: nextjs-blog'));

    const indexFile = await fs.readFile('infrastructure/index.ts', 'utf-8');
    assert(indexFile.includes('import { StorageS3 }'));
    assert(indexFile.includes('import { PostgresRdsCluster }'));
  });

  test('cli installs files with db and storage', async (t) => {
    const mockInputs = ['nextjs-blog', 'y', 'y'];
    let currentInput = 0;
    // mock process
    global.process = {
      argv: ['node', 'cli'],
      stdin: {
        once: (event: string, cb: (data: string) => void) => {
          cb(mockInputs[currentInput++]);
        },
      },
    } as any;

    await cli();

    // validate that the components directory was created
    await fs.stat('infrastructure/components');

    // validate that the index.ts file was created
    await fs.stat('infrastructure/index.ts');

    // validate the file contents are correct
    const indexFile = await fs.readFile('infrastructure/index.ts', 'utf-8');
    assert(indexFile.includes('import { StorageS3 }'));
    assert(indexFile.includes('import { PostgresRdsCluster }'));
  });

  test('cli installs files without db and storage', async (t) => {
    const mockInputs = ['nextjs-blog', 'n', 'n'];
    let currentInput = 0;
    // mock process
    global.process = {
      argv: ['node', 'cli'],
      stdin: {
        once: (event: string, cb: (data: string) => void) => {
          cb(mockInputs[currentInput++]);
        },
      },
    } as any;

    await cli();

    // validate that the components directory was created
    await fs.stat('infrastructure/components');

    // validate that the index.ts file was created
    await fs.stat('infrastructure/index.ts');

    // validate the file contents are correct
    const indexFile = await fs.readFile('infrastructure/index.ts', 'utf-8');
    assert(!indexFile.includes('import { StorageS3 }'));
    assert(!indexFile.includes('import { PostgresRdsCluster }'));
  });
});