import { exec } from 'child_process';
import fs from 'fs/promises';
import { fileExists } from './files';

/**
 * Installs the specified npm packages as dependencies in the 'infrastructure' directory.
 *
 * @param packages - An array of package names to install.
 * @returns A promise that resolves with the standard output of the npm install command, or rejects with an error.
 */
export async function installDependencies(directory: string, packages: string[]) {
  return new Promise((resolve, reject) => {
    exec(`npm install --save ${packages.join(' ')}`, { cwd: 'infrastructure' }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

export const hasDependency = async (dependency: string) => {
  if (!(await fileExists('package.json'))) {
    return false;
  }

  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  return Boolean(
    packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency],
  )
}