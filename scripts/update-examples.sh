#!/bin/bash

set -e

echo "Updating nextjs-fullstack-aws..."
rm -rf examples/nextjs-fullstack-aws/infrastructure
pnpm dev init \
  --directory examples/nextjs-fullstack-aws \
  --projectType fullstack-aws \
  --name nextjs-fullstack-aws \
  --includeStorage \
  --includeDb

echo "Updating nextjs-fullstack-aws-vanilla..."
rm -rf examples/nextjs-fullstack-aws-vanilla/infrastructure examples/nextjs-fullstack-aws-vanilla/Dockerfile examples/nextjs-fullstack-aws-vanilla/.dockerignore
pnpm dev init \
  --directory examples/nextjs-fullstack-aws-vanilla \
  --projectType fullstack-aws \
  --name nextjs-vanilla \
  --includeStorage=false \
  --includeDb=false

echo "Updating express-fullstack-aws-vanilla..."
rm -rf examples/express-fullstack-aws-vanilla/infrastructure
pnpm dev init \
  --directory examples/express-fullstack-aws-vanilla \
  --projectType fullstack-aws \
  --name express-vanilla \
  --includeStorage=false \
  --includeDb=false \
  --port=9000