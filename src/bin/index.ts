#!/usr/bin/env -S npx tsx

import { program } from 'commander';
import { init } from '@/commands/init';

// Handle Ctrl+C even when raw mode is used (for prompts)
process.stdin.on("keypress", function (_chunk, key) {
  if (key && key.name === "c" && key.ctrl) {
    console.log("\n\nExiting...");
    process.exit(1);
  }
});

program.addCommand(init);
program.parseAsync();