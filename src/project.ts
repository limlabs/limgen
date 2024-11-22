import { promises as fs } from "fs";
import { exec } from "child_process";
import path from "path";
import { generatePackageJSON, generateTSConfig } from "./workspace";
import { copyFileDependencies } from "./files";
import { installDependencies } from "./npm";
import { initOptionsSchema } from "./commands/init";
import { z } from "zod";

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
  inputs(initArgs: { name: string; }): Promise<{
    name: string;
    message: string;
    schema: any;
  }[]>,

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
  return await import(`./projectTypes/${projectType}/project`);
}

/**
 * Initializes a project folder within the 'infrastructure' directory.
 * Creates the directory recursively if it does not exist.
 *
 * @param projectName - The name of the project for which the folder is to be created.
 * @returns A promise that resolves when the directory has been created.
 */
export async function ensureProjectFolder(projectName: string) {
  await fs.mkdir(path.join('infrastructure', 'projects', projectName), { recursive: true });
}

export interface ProjectIndexFileOptions {
  projectName: string;
  inputs: any;
}

/**
 * Generates the index file for the given project.
 *
 * @param project - The LimgenProject instance for which the index file is to be generated.
 * @param opts - Options to be passed to the project's default method.
 * @returns A promise that resolves when the index file has been written.
 */
export async function generateIndexFile(project: LimgenProject, inputs: any) {
  await ensureProjectFolder(inputs.projectName);
  const result = await project.default(inputs);

  await fs.writeFile(path.join('infrastructure', 'projects', inputs.projectName, 'index.ts'), result);
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
  await ensureProjectFolder(opts.projectName);
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

  await fs.writeFile(path.join('infrastructure', 'projects', opts.projectName, 'Pulumi.yaml'), yaml);
}

export async function renderProject(cmdArgs: z.infer<typeof initOptionsSchema>, project: LimgenProject, inputs: any) {
  const { packages, files } = await project.dependsOn(inputs);

  await Promise.all([
    copyFileDependencies(files),
    generateIndexFile(project, inputs),
    generatePackageJSON().then(() => installDependencies(cmdArgs.directory, packages)),
    generateTSConfig(),
    generateProjectYaml(inputs),
  ])
}