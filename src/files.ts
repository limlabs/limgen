import fs from 'fs/promises';

/**
 * Copies dependencies required for the project to the infrastructure directory.
 *
 * @param project - The LimgenProject instance for which dependencies are to be copied.
 * @param opts - Options to be passed to the project's dependsOn method.
 * @returns A promise that resolves when the dependencies have been copied.
 */
export async function copyFileDependencies(files: string[]) {
  for (const dep of files) {
    await fs.copyFile(`${__dirname}/${dep}`, `infrastructure/${dep}`);
  }
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