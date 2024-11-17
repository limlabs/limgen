import fs from 'fs/promises';
import { copyDependencies, generateIndexFile, generateProjectYaml, generateTSConfig, importProject } from './utils';

/**
 * 1. Creates a new directory if not exists called infrastructure
 * 2. Adds a directory if not exists called components
 * 3. Creates a file called infrastructure/index.ts
 * 4. Write out command for standing up their new stack with the files in the infrastructure directory
 */
export async function cli() {

  // Check if pulumi exists as a command
  try {
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('pulumi version', (error: unknown) => {
        if (error) {
          reject(new Error('Pulumi CLI not found. Please install Pulumi CLI and try again.'));
        } else {
          resolve(true);
        }
      });
    });
  } catch (e) {
    console.error('Pulumi CLI not found. Please install Pulumi CLI and try again.');
    process.exit(1);
  }

  // Get the component name from the first argument
  let projectName = process.argv[2];

  // prompt for component name and read from stdin if not provided
  while (!projectName) {
    // prompt for component name
    console.log('Please provide a project name:');
    // read from stdin
    projectName = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve((data ?? '').toString().trim());
      });
    });
  }

  let includeDbInput = process.argv[3]?.toLowerCase();
  while (includeDbInput !== 'y' && includeDbInput !== 'n') {
    console.log('Would you like to include a database? (Y/n)');
    includeDbInput = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve((data ?? 'y').toString().trim());
      });
    });
  } ;

  let includeStorageInput = process.argv[4]?.toLowerCase();
  while (includeStorageInput !== 'y' && includeStorageInput !== 'n') {
    console.log('Would you like to include storage? (Y/n)');
    includeStorageInput = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve((data ?? 'y').toString().trim());
      });
    });
  }

  const includeDb = includeDbInput.toLowerCase() === 'y' ? true : false;
  const includeStorage = includeStorageInput.toLowerCase() === 'y' ? true : false;

  console.log('Including DB:', includeDb);
  console.log('Including Storage:', includeStorage);
  // TODO: Check if pulumi is logged in

  // create infrastructure directory
  await fs.mkdir('infrastructure', { recursive: true });

  // generate tsconfig.json
  await generateTSConfig();
  
  // copy src/utils to $cwd/infrastructure/utils
  await fs.cp(`${__dirname}/utils`, 'infrastructure/utils', { recursive: true });
  
  const opts = {
    projectName,
    includeDb,
    includeStorage,
  };
  
  const project = await importProject('fullstack-aws');

  await copyDependencies(project, opts);
  await generateIndexFile(project, opts);
  await generateProjectYaml({ projectName });

  // check if infrastructure/package.json exists
  try {
    await fs.stat('infrastructure/package.json');
  } catch (e) {
    // if it doesn't exist, create it
    await fs.writeFile('infrastructure/package.json', JSON.stringify({ name: 'infrastructure', version: '1.0.0' }, null, 2));
  }

  // update the package.json to include @pulumi/pulumi, @pulumi/aws, @pulumi/awsx, and @pulumi/random
  // (eventually we will load these from the file imports in the components that are copied over)
  const packageJSON = JSON.parse(await fs.readFile('infrastructure/package.json', 'utf-8'));

  packageJSON.dependencies = packageJSON.dependencies || {};

  // get the package versions from this library to ensure they are in sync
  const limgenPackageJson = JSON.parse(await fs.readFile(`${__dirname}/../package.json`, 'utf-8'));
  packageJSON.dependencies['@pulumi/pulumi'] = limgenPackageJson.devDependencies['@pulumi/pulumi'];
  packageJSON.dependencies['@pulumi/aws'] = limgenPackageJson.devDependencies['@pulumi/aws'];
  packageJSON.dependencies['@pulumi/awsx'] = limgenPackageJson.devDependencies['@pulumi/awsx'];
  packageJSON.dependencies['@pulumi/random'] = limgenPackageJson.devDependencies['@pulumi/random'];

  await fs.writeFile('infrastructure/package.json', JSON.stringify(packageJSON, null, 2));
}
