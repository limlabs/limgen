import { fileExists } from "@/files";
import { dockerfileExists } from "../../docker";
import fs from "fs/promises";

export const inputs = async (cmdArgs: any, projectInput: any) => {
  return []
}

export const collectInput = async (cmdArgs: any, projectInput: any, frameworkArgs: any) => {
  return {}
}

export interface TanstackStartFrameworkInput {
}

export default async function tanstackStartFramework(opts: TanstackStartFrameworkInput) {
  await Promise.all([
    ensureDockerfile(opts),
    ensureAppConfig(),
    updateDockerignore()
  ])
}

const updateDockerignore = async () => {
  if (!await fileExists('.dockerignore')) {
    await fs.writeFile('.dockerignore', '');
  }

  const contents = await fs.readFile('.dockerignore', 'utf-8');
  const depsToCheck = [
    'node_modules',
    '*.log',
    '.vinxi',
    '.git',
    '.DS_Store',
    '.output',
    '/data',
  ];

  const outputToAppend = depsToCheck.filter(dep => !contents.includes(dep)).join('\n');

  if (outputToAppend.length === 0) {
    return;
  }
  
  await fs.appendFile('.dockerignore', `\n${outputToAppend}`);
}

const ensureDockerfile = async (opts: TanstackStartFrameworkInput) => {
  if (await dockerfileExists()) {
    return;
  }

  try {
    await fs.copyFile(`${__dirname}/Dockerfile`, 'Dockerfile');
  } catch (error) {
    console.error('Unable to render Dockerfile', error)
    throw error
  }
}

const ensureAppConfig = async () => {
  const appConfigFile = 'app.config.ts';
  let appConfig = await fs.readFile(appConfigFile, 'utf-8');

  const serverMatch = appConfig.match(/server: *{/);
  if (!serverMatch) {
    appConfig = appConfig.replace(
      /export default defineConfig\({/,
      `export default defineConfig({\n  server: { preset: 'node-server' },\n`
    );
  } else {
    const presetMatch = appConfig.match(/preset: *'(.+)'/);
    if (presetMatch && presetMatch?.[1] !== 'node-server') {
      throw new Error(`Limgen support for Tanstack start is limited to the node-server preset. Current value is ${presetMatch[1]}`);
    } else if (!presetMatch) {
      console.warn('Unable to find server preset in app.config.ts. You may need to update it manually.\n See https://tanstack.com/router/latest/docs/framework/react/start/hosting/#nodejs for more info');
    }
  }

  await fs.writeFile(appConfigFile, appConfig);
}