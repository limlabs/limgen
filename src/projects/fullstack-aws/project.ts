import { initOptionsSchema } from '../../commands/init';
import { cliBoolean, cliInteger } from '../../schema';
import ejs from 'ejs';
import path from 'path';
import prompts from 'prompts';
import z from 'zod';

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
};

export default function fullstackAWSProject(inputs: FullstackAWSProjectOptions): Promise<string> {
  return ejs.renderFile(path.join(__dirname, 'template.ejs.t'), inputs);
}