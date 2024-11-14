import test from "node:test";

import { cli } from "@/cli";
import fs from 'fs/promises';

test('cli installs files', async (t) => {
  process.argv[2] = 'nextjs-blog';
  await cli();

  // validate that the components directory was created
  await fs.stat('infrastructure/components');

  // validate that the index.ts file was created
  await fs.stat('infrastructure/index.ts');

  // validate that the nextjs-blog.ts file was created
  await fs.stat('infrastructure/components/nextjs-blog.ts');
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

  // validate that the nextjs-blog.ts file was created
  await fs.stat('infrastructure/components/nextjs-blog.ts');
});