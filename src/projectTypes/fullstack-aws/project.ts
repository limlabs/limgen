import ejs from 'ejs';
import path from 'path';
import prompts from 'prompts';
import z from 'zod';
import fs from 'fs/promises';
import { initOptionsSchema } from '../../commands/init';
import { cliBoolean, cliInteger } from '../../schema';
import { fileExists } from '../../files';

export const dependsOn = async (opts: FullstackAWSProjectOptions) => {
  const files: string[] = [
    'components/app-fargate.ts',
    'components/cdn-cloudfront.ts',
    'components/lb-alb-public.ts',
    'components/vpc-public.ts',
    'utils/deep-merge.ts',
    'utils/prefixed.ts',
  ];

  const packages = [
    '@pulumi/aws',
    '@pulumi/awsx',
    '@pulumi/pulumi',
  ];

  if (opts.includeStorage) {
    files.push('components/storage-s3.ts');
  }

  if (opts.includeDb) {
    files.push('components/db-postgres-rds.ts');
    packages.push('@pulumi/random');
  }

  return {
    files,
    packages,
  };
}

export const inputs = async () => {
  return [
    {
      name: 'includeStorage',
      message: 'Include storage',
      schema: cliBoolean(),
    },
    {
      name: 'includeDb',
      message: 'Include a database',
      schema: cliBoolean(),
    },
    {
      name: 'port',
      message: 'Port to expose',
      schema: cliInteger().optional().default('3000'),
    }
  ]
}

export const collectInput = async (cmdArgs: z.infer<typeof initOptionsSchema>, projectArgs: any) => {
  let includeStorage;
  if (projectArgs.includeStorage === 'unknown') {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeStorage',
        message: 'Include storage?',
        initial: true,
      }
    );

    projectArgs.includeStorage = answer.includeStorage;
  } else {
    includeStorage = projectArgs.includeStorage === 'true';
  }

  let includeDb;
  if (projectArgs.includeDb === 'unknown') {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeDb',
        message: 'Include a database?',
        initial: true,
      }
    );

    includeDb = answer.includeDb;
  } else {
    includeDb = projectArgs.includeDb === 'true';
  }

  return {
    includeStorage,
    includeDb,
    port: projectArgs.port,
  };
}

export type FullstackAWSProjectOptions = {
  includeStorage: boolean;
  includeDb: boolean;
  port: string;
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
infrastructure/`.trim());
  }
}

export const renderIndex = async (inputs: FullstackAWSProjectOptions) => {
  return ejs.renderFile(path.join(__dirname, 'template.ejs.t'), inputs);
}