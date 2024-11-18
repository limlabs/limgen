import { initOptionsSchema } from '@/commands/init';
import { Option } from 'commander';
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

export interface FullstackAWSProjectCommandOptions {
  includeStorage: boolean;
  includeDb: boolean;
}

export const getCommandOptions = () => {
  return [
    new Option('-s, --includeStorage', 'Include storage').default(false),
    new Option('-d, --includeDb', 'Include a database').default(false),
  ]
}

export const collectInput = async (initArgs: z.infer<typeof initOptionsSchema>, subcommandArgs: FullstackAWSProjectCommandOptions) => {
  let includeStorage = subcommandArgs.includeStorage as boolean;
  
  if (includeStorage === undefined) {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeStorage',
        message: 'Include storage?',
      }
    );  

    includeStorage = answer.includeStorage;
  }

  let includeDb = subcommandArgs.includeDb as boolean;
  if (includeDb === undefined) {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeDb',
        message: 'Include a database?',
      }
    );

    includeDb = answer.includeDb;
  }

  return {
    includeStorage,
    includeDb,
  };
}

export type FullstackAWSProjectOptions = {
  includeStorage: boolean;
  includeDb: boolean;
};

export default function fullstackAWSProject(opts: FullstackAWSProjectOptions): Promise<string> {
  const { includeStorage, includeDb } = opts;
  return ejs.renderFile(path.join(__dirname, 'template.ejs.t'), {
    includeStorage,
    includeDb,
  });
}