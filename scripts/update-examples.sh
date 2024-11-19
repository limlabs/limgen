#!/bin/bash

set -e

echo "Updating nextjs-fullstack..."
rm -rf examples/nextjs-fullstack/infrastructure examples/nextjs-fullstack/Dockerfile
pnpm dev init \
  --directory examples/nextjs-fullstack \
  --projectType fullstack-aws \
  --name nextjs-fullstack \
  --includeStorage \
  --includeDb

echo "Updating nextjs-vanilla..."
rm -rf examples/nextjs-vanilla/infrastructure examples/nextjs-vanilla/Dockerfile
pnpm dev init \
  --directory examples/nextjs-vanilla \
  --projectType fullstack-aws \
  --name nextjs-vanilla \
  --includeStorage=false \
  --includeDb=false

echo "Updating express-vanilla..."
rm -rf examples/express-vanilla/infrastructure
pnpm dev init \
  --directory examples/express-vanilla \
  --projectType fullstack-aws \
  --name express-vanilla \
  --includeStorage=false \
  --includeDb=false