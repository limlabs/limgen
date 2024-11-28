set -e

tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json
cp -R src/project-types src/utils src/components src/frameworks dist/