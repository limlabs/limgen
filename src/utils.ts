import fs from 'fs/promises';
import { fullstackAWSProject, FullstackAWSProjectOptions } from './projects/fullstack-aws';

export interface ProjectYamlOptions {
  projectName: string;
}

export type ProjectOptions = FullstackAWSProjectOptions;

export async function generateIndexFile(opts: ProjectOptions) {
  const result = await fullstackAWSProject(opts);

  await fs.writeFile('infrastructure/index.ts', result);
}

export async function generateProjectYaml(opts: ProjectYamlOptions) {
  const yaml = `

name: ${opts.projectName}
description: A pulumi project created with limgen
runtime:
  name: nodejs
  options:
    packagemanager: pnpm
config:
  pulumi:tags:
    value:
      pulumi:template: aws-typescript
  `.trimStart()

  await fs.writeFile('infrastructure/Pulumi.yaml', yaml);
}
