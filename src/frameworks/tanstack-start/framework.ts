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
    port,
  }
}

export interface TanstackStartFrameworkInput {
  port: number;
}

export default async function tanstackStartFramework(opts: TanstackStartFrameworkInput) {
  await Promise.all([
    ensureDockerfile(opts),
    ensureAppConfig(),
    updateDockerignore()
  ])
}

const updateDockerignore = async () => {
  const contents = await fs.readFile('.dockerignore', 'utf-8');
  const depsToCheck = [
    'node_modules',
    '*.log',
    '.vinxi',
    '.git',
    '.DS_Store',
    '.output',
  ];

  const outputToAppend = depsToCheck.filter(dep => !contents.includes(dep)).join('\n');

  await fs.appendFile('.dockerignore', outputToAppend);
}

const ensureDockerfile = async (opts: TanstackStartFrameworkInput) => {
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