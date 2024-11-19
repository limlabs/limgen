set -e

tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json
cp -R src/projects src/utils src/components src/frameworks dist/