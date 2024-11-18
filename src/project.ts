import yargs from "yargs";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { Option } from "commander";

/**
 * Represents the type of a project.
 * 
 * Currently, the only supported project type is 'fullstack-aws'.
 */
export type ProjectType = 'fullstack-aws';

/**
 * Represents information about the dependencies of a project.
 * 
 * @typedef {Object} ProjectDependencyInfo
 * @property {string[]} components - An array of component names that the project depends on.
 * @property {string[]} packages - An array of package names that the project depends on.
 */
export type ProjectDependencyInfo = {
  files: string[];
  packages: string[];
}

/**
 * Represents a Limgen project with customizable options.
 *
 * @template TOpts - The type of options that can be passed to the project methods.
 */
export type LimgenProject<TOpts = unknown> = {
  getCommandOptions(initArgs: any): Option[];
  /**
   * Renders a project template with the provided options.
   *
   * @param opts - Optional parameters for the default action.
   * @returns A promise that resolves to a string result of the default action.
   */
  default: (opts?: TOpts) => Promise<string>;

  /**
   * Determines the dependencies of the project.
   *
   * @param opts - Optional parameters for determining dependencies.
   * @returns A promise that resolves to an array of strings representing the dependencies.
   */
  dependsOn: (opts?: TOpts) => Promise<ProjectDependencyInfo>;

  /**
   * Collects input required to initialize the project.
   *
   * @param initArgs - Initial arguments including project name and framework.
   * @param argv - Additional arguments provided as a record of key-value pairs.
   * @returns A promise that resolves to the collected options.
   */
  collectInput: (initArgs: {
    projectName: string;
    framework: string;
  }, opts: any) => Promise<TOpts>;
}

/**
 * An array containing all possible project types.
 * Currently, it includes only 'fullstack-aws'.
 */
export const AllProjectTypes = ['fullstack-aws'] as const;

/**
 * Imports a project module dynamically based on the provided project type.
 *
 * @param projectType - The type of the project to import.
 * @returns A promise that resolves to the imported project module.
 */
export async function importProject(projectType: ProjectType): Promise<LimgenProject> {
  return await import(`./projects/${projectType}`);
}

/**
 * Generates the index file for the given project.
 *
 * @param project - The LimgenProject instance for which the index file is to be generated.
 * @param opts - Options to be passed to the project's default method.
 * @returns A promise that resolves when the index file has been written.
 */
export async function generateIndexFile(project: LimgenProject, opts: unknown) {
  const result = await project.default(opts);

  await fs.writeFile('infrastructure/index.ts', result);
}

/**
 * Options for generating a project YAML file.
 */
export interface ProjectYamlOptions {
  projectName: string;
}

/**
 * Generates a Pulumi project YAML file with the provided options.
 *
 * @param opts - The options to use when generating the project YAML file.
 * @returns A promise that resolves when the project YAML file has been written.
 */
export async function generateProjectYaml(opts: ProjectYamlOptions) {
  const yaml = `

name: ${opts.projectName}
description: A pulumi project created with limgen
runtime:
  name: nodejs
  options:
    packagemanager: pnpm
config:
  pulumi:tags:
    value:
      pulumi:template: aws-typescript
  `.trimStart()

  await fs.writeFile('infrastructure/Pulumi.yaml', yaml);
}

/**
 * Generates a TypeScript configuration file (tsconfig.json) with predefined settings
 * and writes it to the 'infrastructure' directory.
 *
 * The generated tsconfig.json includes the following settings:
 * - compilerOptions:
 *   - baseUrl: "."
 *   - target: "ES6"
 *   - module: "commonjs"
 *   - strict: false
 *   - esModuleInterop: true
 *   - skipLibCheck: true
 *   - forceConsistentCasingInFileNames: true
 * - include: ["index.ts", "components/**\/*.ts", "utils/**\/*.ts"]
 * - exclude: ["node_modules", "dist"]
 *
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 */
export async function generateTSConfig() {
  const tsconfig = JSON.stringify({
    "compilerOptions": {
      "baseUrl": ".",
      "target": "ES6",
      "module": "commonjs",
      "strict": false,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["index.ts", "components/**/*.ts", "utils/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }, null, 2)

  await fs.writeFile('infrastructure/tsconfig.json', tsconfig);
}

/**
 * Copies dependencies required for the project to the infrastructure directory.
 *
 * @param project - The LimgenProject instance for which dependencies are to be copied.
 * @param opts - Options to be passed to the project's dependsOn method.
 * @returns A promise that resolves when the dependencies have been copied.
 */
export async function copyFileDependencies(files: string[]) {
  await fs.cp(`${__dirname}/utils`, 'infrastructure/utils', { recursive: true });
  await fs.mkdir('infrastructure/components', { recursive: true });
  for (const dep of files) {
    await fs.copyFile(`${__dirname}/${dep}`, `infrastructure/${dep}`);
  }
}

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