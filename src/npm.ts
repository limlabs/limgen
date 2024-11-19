import { exec } from 'child_process';

/**
 * Installs the specified npm packages as dependencies in the 'infrastructure' directory.
 *
 * @param packages - An array of package names to install.
 * @returns A promise that resolves with the standard output of the npm install command, or rejects with an error.
 */
export async function installDependencies(packages: string[]) {
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