set -e

tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json
cp -R src/projectTypes src/utils src/components src/frameworks dist/