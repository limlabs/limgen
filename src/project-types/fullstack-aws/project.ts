import ejs from 'ejs';
import path from 'path';
import prompts from 'prompts';
import z from 'zod';
import fs from 'fs/promises';
import { initOptionsSchema } from '../../commands/init';
import { cliBoolean, cliEnum, cliInteger } from '../../schema';
import { fileExists } from '../../files';
import { BaseProjectInputOptions, readProjectMetadata } from '../../project';
import { execPromise } from '../../utils/exec';

export const dependsOn = async (opts: FullstackAWSProjectOptions) => {
  const files: string[] = [
    'components/app-fargate.ts',
    'components/cdn-cloudfront.ts',
    'components/lb-alb-public.ts',
    'components/vpc-public.ts',
    'utils/deep-merge.ts',
    'utils/prefixed.ts',
  ];

  const packages = [
    '@pulumi/aws',
    '@pulumi/awsx',
    '@pulumi/pulumi',
    'zod',
  ];

  if (opts.includeStorage) {
    files.push('components/storage-s3.ts');
  }

  if (opts.includeDb) {
    files.push('components/db-postgres-rds.ts');
    packages.push('@pulumi/random');
  }

  if (opts.networkType === 'private') {
    files.push('components/bastion-ec2.ts');
  }

  return {
    files,
    packages,
  };
}

export const inputs = async () => {
  return [
    {
      name: 'includeStorage',
      message: 'Include storage',
      schema: cliBoolean(),
    },
    {
      name: 'includeDb',
      message: 'Include a database',
      schema: cliBoolean(),
    },
    {
      name: 'networkType',
      message: 'Network type',
      schema: cliEnum(['public', 'private', 'unknown']).optional(),
    },
    {
      name: 'storageAccess',
      messsage: 'Storage access',
      schema: cliEnum(['private', 'public', 'unknown']).optional(),
    },
    {
      name: 'port',
      message: 'Port to expose',
      schema: cliInteger().optional().default('3000'),
    }
  ]
}

export const collectInput = async (cmdArgs: z.infer<typeof initOptionsSchema>, projectArgs: any) => {
  let includeStorage
  if (projectArgs.includeStorage === 'unknown') {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeStorage',
        message: 'Include storage?',
        initial: true,
      }
    );

    includeStorage = answer.includeStorage;
  } else {
    includeStorage = projectArgs.includeStorage === 'true';
  }

  let storageAccess = projectArgs.storageAccess;
  if (includeStorage && projectArgs.storageAccess === 'unknown') {
    const answer = await prompts(
      {
        type: 'select',
        name: 'storageAccess',
        message: 'Storage access',
        choices: [
          { title: 'Public (useful for static content / media)', value: 'public' },
          { title: 'Private (better for sensitive / personal data)', value: 'private' },
        ],
        initial: 0,
      }
    );

    storageAccess = answer.storageAccess;
  }

  let includeDb;
  if (projectArgs.includeDb === 'unknown') {
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'includeDb',
        message: 'Include a database?',
        initial: true,
      }
    );

    includeDb = answer.includeDb;
  } else {
    includeDb = projectArgs.includeDb === 'true';
  }

  let networkType = projectArgs.networkType;
  if (projectArgs.networkType === 'unknown') {
    const answer = await prompts(
      {
        type: 'select',
        name: 'networkType',
        message: 'Network type',
        choices: [
          { title: 'Public (simpler, suitable for development)', value: 'public' },
          { title: 'Private (more secure, requires tunnel to access database)', value: 'private' },
        ],
        initial: 0,
      }
    );

    networkType = answer.networkType;
  }

  return {
    includeStorage,
    includeDb,
    networkType,
    port: projectArgs.port,
    storageAccess,
  };
}


export const envPull = async ({
  projectName,
  stack,
}: {
  projectName: string;
  stack: string;
}) => {
  const metadata = await readProjectMetadata({ projectName });
  const projectInputs = metadata.projectInputs as FullstackAWSProjectOptions;
  const properties = {};

  if (projectInputs.includeStorage) {
    const { stdout: BUCKET_NAME } = await execPromise(
      `pulumi stack output objectStorageBucket --stack ${stack}`,
      { cwd: path.join('infrastructure', 'projects', projectName) });

    Object.assign(properties, { BUCKET_NAME });
  }

  if (projectInputs.includeDb) {
    const { stdout: secretId } = await execPromise(
      `pulumi stack output dbSecret --stack ${stack}`,
      { cwd: path.join('infrastructure', 'projects', projectName) });

    const { stdout: secretResponse } = await execPromise(`aws secretsmanager get-secret-value --secret-id ${secretId}`);

    const DATABASE_URL = JSON.parse(secretResponse).SecretString;
    if (!DATABASE_URL) {
      throw new Error(`Could not get secret value for ${secretId}`);
    }

    Object.assign(properties, { DATABASE_URL });
  }

  await fs.writeFile('.env', Object.entries(properties).map(([key, value]) => `${key}=${value}`.trim()).join('\n'));
}

export type FullstackAWSProjectOptions = BaseProjectInputOptions & {
  projectName: string;
  includeStorage: boolean;
  includeDb: boolean;
  networkType: 'public' | 'private';
  storageAccess?: 'public' | 'private';
  port: string;
};

export default async function fullstackAWSProject(inputs: FullstackAWSProjectOptions): Promise<string> {
  const [indexContents] = await Promise.all([
    renderIndex(inputs),
    updateDockerignore(),
    ensureTunnelScript(inputs),
  ]);

  return indexContents;
}

const updateDockerignore = async () => {
  if (await fileExists('.dockerignore')) {
    // see if infrastructure is already in the .dockerignore file
    const dockerignore = await fs.readFile('.dockerignore', 'utf-8');
    if (!dockerignore.includes('infrastructure')) {
      await fs.appendFile('.dockerignore', '\ninfrastructure\n');
    }
  } else {
    await fs.writeFile('.dockerignore', `
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git
.env*
infrastructure/`.trim());
  }
}

export const renderIndex = async (inputs: FullstackAWSProjectOptions) => {
  return ejs.renderFile(path.join(__dirname, 'index.ejs.t'), inputs);
}

export const ensureTunnelScript = async (inputs: FullstackAWSProjectOptions) => {
  if (!(inputs.includeDb && inputs.networkType === 'private')) {
    return;
  }

  // copy the scripts from the scripts folder
  await fs.mkdir('infrastructure/scripts', { recursive: true });
  await fs.copyFile(path.join(__dirname, 'scripts', 'db-tunnel.sh'), 'infrastructure/scripts/db-tunnel.sh');

  // does the current working directory contain a package.json file?
  if (await fileExists('package.json')) {
    // read the package.json file
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));

    // add the start script
    packageJson.scripts = packageJson.scripts || {};

    if (packageJson.scripts.tunnel) {
      // TODO: Is there something better than a dead-end here we can help the user with?
      // What if their tunnel script is different?
      // What if it's outdated version and they want to update it?
      // What they have multiple tunnels they need to manage?
      return;
    }

    packageJson.scripts.tunnel = `infrastructure/scripts/db-tunnel.sh ${inputs.projectName}`;

    // write the package.json file
    await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
  }
}
