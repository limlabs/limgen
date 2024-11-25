import { describe, test } from "node:test";
import fs from "node:fs/promises";
import { generateProjectYaml } from "@/project";
import assert from "node:assert";

describe('generateProjectYaml', async () => {
  await fs.mkdir('test/output', { recursive: true });
  process.chdir('test/output');

  test('should generate a Pulumi.yaml file', async () => {
    await generateProjectYaml({
      projectName: 'my-project',
      projectType: 'aws-fullstack',
      framework: 'aws',
      includeStorage: false,
      includeDb: false
    });

    const yaml = await fs.readFile('infrastructure/projects/my-project/Pulumi.yaml', 'utf-8');
    assert.equal(yaml, `
name: my-project
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
  });
});