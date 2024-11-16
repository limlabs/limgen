import test from "node:test";

import { cli } from "@/cli";
import fs from 'fs/promises';
import assert from "node:assert";
process.chdir('examples/nextjs-vanilla');

test('cli installs files', async (t) => {
  process.argv[2] = 'fullstack-fargate';
  await cli();

  // validate that the components directory was created
  await fs.stat('infrastructure/components');

  // validate that the index.ts file was created
  await fs.stat('infrastructure/index.ts');

  // validate the file contents are correct
  const indexFile = await fs.readFile('infrastructure/index.ts', 'utf-8');
  assert(indexFile.includes('import { VpcPublic } from "./components/vpc-public";'));
  assert(indexFile.includes('import { AppFargate } from "./components/app-fargate";'));
  assert(indexFile.includes('import { CdnCloudFront } from "./components/cdn-cloudfront";'));
  assert(!indexFile.includes('import { PostgresRdsClusterComponent }'));
  assert(!indexFile.includes('import { StorageS3 }'));
});

test('cli prompts for component name', async (t) => {
  // mock process
  global.process = {
    argv: ['node', 'cli'],
    stdin: {
      once: (event: string, cb: (data: string) => void) => {
        cb('nextjs-blog');
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
});
