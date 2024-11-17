import ejs from 'ejs';
import path from 'path';

export const dependsOn = async (opts: FullstackAWSProjectOptions) => {
  const deps: string[] = [
    'components/app-fargate.ts',
    'components/cdn-cloudfront.ts',
    'components/lb-alb-public.ts',
    'components/vpc-public.ts',
    'utils/deep-merge.ts',
    'utils/prefixed.ts',
  ];

  if (opts.includeStorage) {
    deps.push('./components/storage-s3.ts');
  }

  if (opts.includeDb) {
    deps.push('./components/db-postgres-rds.ts');
  }

  return deps;
}

export type FullstackAWSProjectOptions = {
  includeStorage: boolean;
  includeDb: boolean;
  dbProvider?: 'postgres';
  storageProvider?: 's3';
};

export default function fullstackAWSProject(opts: FullstackAWSProjectOptions): Promise<string> {
  const { includeStorage, includeDb, storageProvider, dbProvider } = opts;

  return ejs.renderFile(path.join(__dirname, 'template.ejs.t'), {
    includeStorage,
    includeDb,
    storageProvider,
    dbProvider,
  });
}