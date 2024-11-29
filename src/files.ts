import fs from 'fs/promises';
import { join } from 'path';

/**
 * Copies dependencies required for the project to the infrastructure directory.
 *
 * @param project - The LimgenProject instance for which dependencies are to be copied.
 * @param opts - Options to be passed to the project's dependsOn method.
 * @returns A promise that resolves when the dependencies have been copied.
 */
export async function copyFileDependencies(files: string[]) {
  for (const dep of files) {
    await fs.copyFile(join(__dirname, dep), join('infrastructure', dep));
  }
}

export async function mkdirp(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  }
  catch {
    return false;
  }
}