import ejs from 'ejs';
import path from 'path';

export type FullstackFargateProjectOptions = {
  includeStorage: boolean;
  includeDb: boolean;
  dbProvider?: 'postgres';
  storageProvider?: 's3';
};

export function fullstackFargateProject(opts: FullstackFargateProjectOptions): Promise<string> {
  const { includeStorage, includeDb, storageProvider, dbProvider } = opts;

  return ejs.renderFile(path.join(__dirname, 'template.ejs.t'), {
    includeStorage,
    includeDb,
    storageProvider,
    dbProvider,
  });
}