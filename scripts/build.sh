# Set execution permissions
set -e

# Build project and replace path aliases
tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json

# Copy non source files to dist
cp -R src/project-types src/utils src/components src/frameworks dist/

# Remove all .ts files except declaration files
find ./dist -name "*.ts" | grep -Pv '\.d\.ts$' | xargs rm