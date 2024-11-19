import fs from 'fs/promises';
import { AllProjectTypes } from './project';
import { copyFileDependencies } from './files';
import { installDependencies } from './npm';

/**
 * Represents the type of framework being used.
 * 
 * - 'nextjs': Indicates that the framework is Next.js.
 * - 'unknown': Indicates that the framework is unknown.
 */
export type FrameworkType = 'nextjs'|'unknown';

export const AllFrameworkTypes = ['nextjs', 'unknown'] as const;

/**
 * Represents a langauge-specific framework, such as Laravel, Django, or Next.js.
 */
export interface Framework {
  dependsOn(inputs: any): Promise<{ packages: string[], files: string[] }>;
  inputs: (cmdArgs: any, projectInputs: any) => Promise<{ name: string, message: string, schema: any }[]>;
  collectInput: (cmdArgs: any, projectInputs: any, frameworkArgs: any) => Promise<any>;
  default: (inputs: any) => Promise<void>;
}

/**
 * A constant object that maps recognized framework types to their corresponding project types.
 * 
 * @constant
 * @type {Record<FrameworkType, ProjectType[]>}
 * 
 * @property {ProjectType[]} nextjs - Represents the project types associated with the 'nextjs' framework.
 * @property {ProjectType[]} unknown - Represents all project types associated with an unknown framework.
 */
export const RecognizedProjectFrameworkTypes = {
  'nextjs': ['fullstack-aws'],
  'unknown': AllProjectTypes,
} as const;

/**
 * Detects the framework being used in the project.
 * 
 * @returns {Promise<FrameworkType>} The detected framework type.
 */
export async function detectFramework(): Promise<FrameworkType> {
  const packageJSON = await fs.readFile('package.json', 'utf-8');
  const packageJSONParsed = JSON.parse(packageJSON);
  
  // check for next in dependencies
  if (packageJSONParsed.dependencies['next']) {
    return 'nextjs';
  }

  return 'unknown';
}

/**
 * Gets the supported project types for a given framework.
 * 
 * @param {FrameworkType} framework - The framework to get supported project types for.
 * 
 * @returns {Promise<ProjectType[]>} The supported project types for the given framework.
 */
export async function getSupportedProjectTypesForFramework(framework: FrameworkType) {
  return RecognizedProjectFrameworkTypes[framework] ?? RecognizedProjectFrameworkTypes['unknown'];
}

export async function importFramework(frameworkType: FrameworkType): Promise<Framework> {
  if (!AllFrameworkTypes.includes(frameworkType)) {
    throw new Error(`Unsupported framework type: ${frameworkType}`);
  }

  return await import(`./frameworks/${frameworkType}/framework`);
}

export async function renderFramework(framework: Framework, inputs: any) {
  const tasks: Promise<unknown>[] = [framework.default(inputs)];

  if (framework.dependsOn) {
    const { packages, files } = await framework.dependsOn(inputs);
    tasks.push(copyFileDependencies(files));
    tasks.push(installDependencies(packages));
  }

  await Promise.all(tasks);
}