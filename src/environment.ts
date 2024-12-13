import { exec } from 'child_process';
import fs from 'fs/promises';
import util from 'util';

export const usesEnvironmentVariable = async (envVarName: string) => {
  // do a text search in the source code for the environment variable
  // check all .ts, .js, .json, prisma.schema, and Dockerfile files

  // if the environment variable is found, return true
  // if the environment variable is not found, return false

  const execPromise = util.promisify(exec);

  const searchFiles = async (pattern: string, files: string[]) => {
    let excludeList: string[] = [];

    try {
      const gitignoreContent = await fs.readFile('.gitignore', 'utf-8');
      const gitignorePatterns = gitignoreContent.split('\n')
        .filter(line => line?.trim() && !line.startsWith('#'))
        .map(line => line.trim());
      excludeList = gitignorePatterns;
    } catch {
      // If .gitignore doesn't exist or can't be read, proceed without excluding any files
    }


    try {
      const files = fs.glob(`**/*`);
      let filesToSearch = [];
      for await (const file of files) {
        console.log('file', file);
        console.log('excludeList', excludeList);
        if (!excludeList.some(pattern => file.match(pattern))) {
          filesToSearch.push(file);
        }
      }

      if (filesToSearch.length === 0) {
        return false;
      }

      const grepCmd = `grep -rh '${pattern}' ${filesToSearch.join(' ')} 2>/dev/null`;
      const { stdout } = await execPromise(grepCmd);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  };

  const filesToSearch = [
    '*.ts',
    '*.js',
    '*.json',
    'prisma.schema',
    'Dockerfile',
  ];

  const found = await searchFiles(envVarName, filesToSearch);
  if (found) {
    return true;
  }

  return false;
}