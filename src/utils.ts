import fs from 'fs/promises';

export interface ProjectYamlOptions {
  projectName: string;
}

export type LimgenProjectType = 'fullstack-aws';
export type LimgenProject<TOpts = unknown> = {
  default: (opts?: TOpts) => Promise<string>;
  dependsOn: (opts?: TOpts) => Promise<string[]>;
}

export async function importProject(projectType: LimgenProjectType): Promise<LimgenProject> {
  return await import(`./projects/${projectType}`);
}

export async function generateIndexFile(project: LimgenProject, opts: unknown) {
  const result = await project.default(opts);

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

export async function generateTSConfig() {
  const tsconfig = JSON.stringify({
    "compilerOptions": {
      "baseUrl": ".",
      "target": "ES6",
      "module": "commonjs",
      "strict": false,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["index.ts", "components/**/*.ts", "utils/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }, null, 2)

  await fs.writeFile('infrastructure/tsconfig.json', tsconfig);
}

export async function copyDependencies(project: LimgenProject, opts: unknown) {
  const deps = await project.dependsOn(opts);

  await fs.cp(`${__dirname}/utils`, 'infrastructure/utils', { recursive: true });
  await fs.mkdir('infrastructure/components', { recursive: true });
  for (const dep of deps) {
    await fs.copyFile(`${__dirname}/${dep}`, `infrastructure/${dep}`);
  }
}