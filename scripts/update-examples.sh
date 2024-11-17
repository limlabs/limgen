#!/bin/bash

set -e

echo "Updating nextjs-fullstack..."
(cd examples/nextjs-fullstack && rm -rf infrastructure && pnpm tsx ../../src/index.ts nextjs-fullstack y y && cd infrastructure && pnpm install)

echo "Updating nextjs-vanilla..."
(cd examples/nextjs-vanilla && rm -rf infrastructure && pnpm tsx ../../src/index.ts nextjs-vanilla n n && cd infrastructure && pnpm install)