import { initOptionsSchema, NullableCliOption } from '@/commands/init';
import { cliBoolean } from '@/schema';
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

export const options = async () => {
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
  ]
}

export const collectInput = async (initArgs: z.infer<typeof initOptionsSchema>, args: FullstackAWSProjectCommandOptions) => {
  let includeStorage;
  if (args.includeStorage === 'unknown') {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeStorage',
        message: 'Include storage?',
        initial: true,
      }
    );

    args.includeStorage = answer.includeStorage;
  } else {
    includeStorage = args.includeStorage === 'true';
  }

  let includeDb;
  if (args.includeDb === 'unknown') {
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
    includeDb = args.includeDb === 'true';
  }

  return {
    includeStorage,
    includeDb,
  };
}

export type FullstackAWSProjectOptions = {
  includeStorage: NullableCliOption;
  includeDb: NullableCliOption;
};

export default function fullstackAWSProject(opts: FullstackAWSProjectOptions): Promise<string> {
  return ejs.renderFile(path.join(__dirname, 'template.ejs.t'), opts);
}