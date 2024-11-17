#!/bin/bash

set -e

echo "Updating nextjs-fullstack..."
(cd examples/nextjs-fullstack && pnpm tsx ../../src/index.ts nextjs-fullstack y y)

echo "Updating nextjs-vanilla..."
(cd examples/nextjs-vanilla && pnpm tsx ../../src/index.ts nextjs-vanilla n n)