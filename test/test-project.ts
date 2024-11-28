import test from "node:test";
import { describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";

import { readProjectMetadata } from "@/project";

describe('project', async () => {
  await fs.mkdir('test/output/read-project-metadata', { recursive: true });
  process.chdir('test/output/read-project-metadata');

  describe('read project metadata', () => {
    test('should read project metadata from a project file', async () => {
      
      await fs.mkdir('infrastructure/projects/my-project', { recursive: true });
      await fs.writeFile('infrastructure/projects/my-project/Pulumi.yaml', `
name: nextjs-fullstack-aws
description: A pulumi project created with limgen
runtime:
  name: nodejs
  options:
    packagemanager: pnpm
config:
  pulumi:tags:
    value:
      pulumi:template: aws-typescript
limgen:
    projectName: my-project
    projectType: aws-fullstack
    framework: aws
    projectInputs:
      includeStorage: false
      includeDb: false

`.trimStart());

      const metadata = await readProjectMetadata({
        projectName: 'my-project',
      });

      assert.equal(metadata.projectName, 'my-project');
      assert.equal(metadata.projectType, 'aws-fullstack');
      assert.equal(metadata.framework, 'aws');
      assert.equal(metadata.projectInputs.includeStorage, false);
      assert.equal(metadata.projectInputs.includeDb, false);
    });
  })
});