#!/bin/bash

set -e

echo "Updating nextjs-fullstack-aws..."
rm -rf examples/nextjs-fullstack-aws/infrastructure
pnpm dev init \
  --directory examples/nextjs-fullstack-aws \
  --projectType fullstack-aws \
  --name nextjs-fullstack-aws \
  --includeStorage \
  --includeDb \
  --networkType=public

echo "Updating nextjs-fullstack-aws-private..."
rm -rf examples/nextjs-fullstack-aws-private/infrastructure
pnpm dev init \
  --directory examples/nextjs-fullstack-aws-private \
  --projectType fullstack-aws \
  --name nextjs-fullstack-aws-private \
  --includeStorage \
  --includeDb \
  --networkType=private

echo "Updating nextjs-fullstack-aws-vanilla..."
rm -rf examples/nextjs-fullstack-aws-vanilla/infrastructure examples/nextjs-fullstack-aws-vanilla/Dockerfile examples/nextjs-fullstack-aws-vanilla/.dockerignore
pnpm dev init \
  --directory examples/nextjs-fullstack-aws-vanilla \
  --projectType fullstack-aws \
  --name nextjs-vanilla \
  --includeStorage=false \
  --includeDb=false \
  --networkType=public

echo "Updating express-fullstack-aws-vanilla..."
rm -rf examples/express-fullstack-aws-vanilla/infrastructure
pnpm dev init \
  --directory examples/express-fullstack-aws-vanilla \
  --projectType fullstack-aws \
  --name express-vanilla \
  --includeStorage=false \
  --includeDb=false \
  --networkType=public \
  --port=9000 