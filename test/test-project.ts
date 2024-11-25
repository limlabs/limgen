import test from "node:test";
import { describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";

import { readProjectMetadata } from "@/project";

describe('project', () => {
  describe('read project metadata', () => {
    test('should read project metadata from a project file', async () => {
      await fs.mkdir('test/output/read-project-metadata/infrastructure/my-project', { recursive: true });
      await fs.writeFile('test/output/read-project-metadata/infrastructure/my-project/Pulumi.yaml', `
name: nextjs-fullstack-aws
description: A pulumi project created with limgen
runtime:
  name: nodejs
  options:
    packagemanager: pnpm
config:
  limgen:
    projectName: my-project
    projectType: aws-fullstack
    framework: aws
    projectInputs:
      includeStorage: false
      includeDb: false
  pulumi:tags:
    value:
      pulumi:template: aws-typescript

`.trimStart());

      const metadata = await readProjectMetadata({
        projectName: 'my-project',
        directory: 'test/output/read-project-metadata',
      });

      assert.equal(metadata.projectName, 'my-project');
      assert.equal(metadata.projectType, 'aws-fullstack');
      assert.equal(metadata.framework, 'aws');
      assert.equal(metadata.projectInputs.includeStorage, false);
      assert.equal(metadata.projectInputs.includeDb, false);
    });
  })
});