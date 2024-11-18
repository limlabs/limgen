#!/usr/bin/env -S npx tsx

import { program } from 'commander';
import { init } from '@/commands/init';

process.on('SIGINT', () => {
  console.log('Process interrupted. Exiting...');
  process.exit();
});

program.addCommand(init);
program.parseAsync();