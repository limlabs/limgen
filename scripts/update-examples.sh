#!/bin/bash

set -e

echo "Updating nextjs-fullstack..."
rm -rf examples/nextjs-fullstack/infrastructure
pnpm dev init \
  --directory examples/nextjs-fullstack \
  --projectType fullstack-aws \
  --name nextjs-fullstack \
  --includeStorage=true \
  --includeDb=true 

echo "Updating nextjs-vanilla..."
rm -rf examples/nextjs-vanilla/infrastructure
pnpm dev init \
  --directory examples/nextjs-vanilla \
  --projectType fullstack-aws \
  --name nextjs-vanilla \
  --includeStorage=false \
  --includeDb=false 