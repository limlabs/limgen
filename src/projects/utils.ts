import fs from 'fs/promises';

export interface ProjectYamlOptions {
  projectName: string;
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
