import fs from 'fs/promises';
import { AllProjectTypes, ProjectType } from './project';

/**
 * Represents the type of framework being used.
 * 
 * - 'nextjs': Indicates that the framework is Next.js.
 * - 'unknown': Indicates that the framework is unknown.
 */
export type FrameworkType = 'nextjs'|'unknown';

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