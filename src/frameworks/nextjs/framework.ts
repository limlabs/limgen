import { ProjectType } from "@/project";
import { dockerfileExists, getDockerfilePort } from "../../docker";
import { cliInteger } from "../../schema";
import ejs from "ejs";
import fs from "fs/promises";

export const inputs = async (cmdArgs: any, projectInput: any) => {
  return [
    {
      name: 'port',
      message: 'Port to expose',
      schema: cliInteger().optional(),
    }
  ]
}

export const collectInput = async (cmdArgs: any, projectInput: any, frameworkArgs: any) => {
  let port = frameworkArgs.port;
  if (!port || port === 'unknown') {
    const dockerfilePort = await getDockerfilePort();
    if (dockerfilePort === null) {
      port = 3000;
    }
  }

  return {
    projectType: projectInput.projectType,
    port,
  }
}

export interface NextJSFrameworkInput {
  projectType: ProjectType;
  port: number;
}

export default async function nextJsFramework(opts: NextJSFrameworkInput) {
  await Promise.all([
    ensureDockerfile(opts),
    updateNextConfig(opts.projectType),
    updateDockerignore(opts)
  ])
}

const updateDockerignore = async (opts: NextJSFrameworkInput) => {
  if (opts.projectType !== 'fullstack-aws') {
    return;
  }

  const contents = await fs.readFile('.dockerignore', 'utf-8');
  if (!contents.includes('node_modules')) {
    await fs.appendFile('.dockerignore', 'node_modules\n');
  }
}

const ensureDockerfile = async (opts: NextJSFrameworkInput) => {
  if (opts.projectType !== 'fullstack-aws') {
    return;
  }

  if (await dockerfileExists()) {
    return;
  }

  try {
    const result = await ejs.renderFile(`${__dirname}/Dockerfile.ejs.t`, opts)
    await fs.writeFile('Dockerfile', result)
  } catch (error) {
    console.error('Unable to render Dockerfile', error)
    throw error
  }
}

const updateNextConfig = async (projectType: ProjectType) => {
  // get next.config.js or next.config.ts
  let nextConfigFile = 'next.config.js';
  try {
    await fs.access('next.config.ts');
    nextConfigFile = 'next.config.ts';
  } catch (error) { }

  const nextConfig = await fs.readFile(nextConfigFile, 'utf-8');

  // update next.config.ts, detect const nextConfig: NextConfig = {
  const nextConfigMatch = nextConfig.match(/const nextConfig: NextConfig = {/);

  if (nextConfigMatch) {
    // find a section matching output: 'standalone'
    const outputMatch = nextConfig.match(/output: *('|")(.+)('|")/);
    const desiredOutputType = projectType === 'fullstack-aws' ? 'standalone' : 'export';
    if (!outputMatch) {
      const updatedNextConfig = nextConfig.replace(
        /const nextConfig: NextConfig = {/,
        `const nextConfig: NextConfig = {\n  output: '${desiredOutputType}',\n`
      );

      await fs.writeFile(nextConfigFile, updatedNextConfig);
    } else if (outputMatch[2] !== desiredOutputType) {
      throw new Error(
        `Your NextJS config 'output' property is not set to '${desiredOutputType}'.\n\n` +
        `Limgen currently requires '${desiredOutputType}' to be set for ${projectType} compatibility.`);
    }
  }
}