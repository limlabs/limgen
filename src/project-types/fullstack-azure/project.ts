import ejs from 'ejs';
import path from 'path';

import z from 'zod';
import fs from 'fs/promises';
import { initOptionsSchema } from '../../commands/init';

import { fileExists } from '../../files';
import { BaseProjectInputOptions } from '../../project';

export const dependsOn = async (opts: FullstackAWSProjectOptions) => {
  const files: string[] = [
    'components/app-azure-acs.ts',
    'utils/prefixed.ts',
  ];

  const packages = [
    '@pulumi/azure-native',
    '@pulumi/pulumi',
    '@pulumi/docker',
    '@pulumi/docker-build',
  ];

  return {
    files,
    packages,
  };
}

export const inputs = async () => {
  return [
   
  ]
}

export const collectInput = async (cmdArgs: z.infer<typeof initOptionsSchema>, projectArgs: any) => {
  return {
  };
}

export const envPull = async ({
  projectName,
  stack,
}: {
  projectName: string;
  stack: string;
}) => {
  throw new Error('Not implemented');
}

export type FullstackAWSProjectOptions = BaseProjectInputOptions & {
  projectName: string;
};

export default async function fullstackAWSProject(inputs: FullstackAWSProjectOptions): Promise<string> {
  const [indexContents] = await Promise.all([
    renderIndex(inputs),
    updateDockerignore(),
  ]);

  return indexContents;
}

const updateDockerignore = async () => {
  if (await fileExists('.dockerignore')) {
    // see if infrastructure is already in the .dockerignore file
    const dockerignore = await fs.readFile('.dockerignore', 'utf-8');
    if (!dockerignore.includes('infrastructure')) {
      await fs.appendFile('.dockerignore', '\ninfrastructure\n');
    }
  } else {
    await fs.writeFile('.dockerignore', `
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git
.env*
infrastructure/`.trim());
  }
}

export const renderIndex = async (inputs: FullstackAWSProjectOptions) => {
  return ejs.renderFile(path.join(__dirname, 'index.ejs.t'), inputs);
}