#!/bin/bash

set -e

echo "Updating nextjs-fullstack-aws..."
rm -rf examples/nextjs-fullstack-aws/infrastructure
pnpm dev init \
  --directory examples/nextjs-fullstack-aws \
  --projectType fullstack-aws \
  --name nextjs-fullstack-aws \
  --includeStorage \
  --storageAccess=public \
  --includeDb \
  --networkType=public \
  --noScroll

echo "Updating nextjs-fullstack-aws-private..."
rm -rf examples/nextjs-fullstack-aws-private/infrastructure
pnpm dev init \
  --directory examples/nextjs-fullstack-aws-private \
  --projectType fullstack-aws \
  --name nextjs-fullstack-aws-private \
  --storageAccess=public \
  --includeStorage \
  --includeDb \
  --networkType=private \
  --noScroll

echo "Updating nextjs-fullstack-aws-vanilla..."
rm -rf examples/nextjs-fullstack-aws-vanilla/infrastructure examples/nextjs-fullstack-aws-vanilla/Dockerfile examples/nextjs-fullstack-aws-vanilla/.dockerignore
pnpm dev init \
  --directory examples/nextjs-fullstack-aws-vanilla \
  --projectType fullstack-aws \
  --name nextjs-vanilla \
  --includeStorage=false \
  --includeDb=false \
  --networkType=public \
  --noScroll

echo "Updating express-fullstack-aws-vanilla..."
rm -rf examples/express-fullstack-aws-vanilla/infrastructure
pnpm dev init \
  --directory examples/express-fullstack-aws-vanilla \
  --projectType fullstack-aws \
  --name express-vanilla \
  --includeStorage=false \
  --includeDb=false \
  --networkType=public \
  --port=9000 \
  --noScroll

echo "Updating tanstack-fullstack-aws..."
rm -rf examples/tanstack-fullstack-aws/infrastructure
pnpm dev init \
  --directory examples/tanstack-fullstack-aws \
  --projectType fullstack-aws \
  --name tanstack-fullstack-aws \
  --includeStorage=false \
  --includeDb=false \
  --networkType=public \
  --noScroll

echo "Updating nextjs-staticsite-aws..."
rm -rf examples/nextjs-staticsite-aws/infrastructure
pnpm dev init \
  --directory examples/nextjs-staticsite-aws \
  --projectType staticsite-aws \
  --name nextjs-staticsite-aws \
  --noScroll