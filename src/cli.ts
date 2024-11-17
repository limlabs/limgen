import fs from 'fs/promises';
import { generateIndexFile, generateProjectYaml } from './utils';

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
  let componentName = process.argv[2];
  
  // prompt for component name and read from stdin if not provided
  while (!componentName) {
    // prompt for component name
    console.log('Please provide a component name:');
    // read from stdin
    componentName = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }

  let includeDbInput = 'y';
  while (includeDbInput.toLowerCase() !== 'y' && includeDbInput.toLowerCase() !== 'n') {
    console.log('Would you like to include a database? (Y/n)');
    includeDbInput = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }

  let includeStorageInput = 'y';
  while (includeStorageInput.toLowerCase() !== 'y' && includeStorageInput.toLowerCase() !== 'n') {
    console.log('Would you like to include storage? (Y/n)');
    includeStorageInput = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }

  const includeDb = includeDbInput.toLowerCase() === 'y' ? true : false;
  const includeStorage = includeStorageInput.toLowerCase() === 'y' ? true : false;

  // TODO: Check if pulumi is logged in

  // create infrastructure directory
  // create components directory
  await fs.mkdir('infrastructure/components', { recursive: true });

  // copy src/components/{componentName}.ts to $cwd/infrastructure/components/{componentName}.ts
  await fs.cp(`${__dirname}/components`, 'infrastructure/components', { recursive: true });

  // generate the index.ts file
  await generateIndexFile({ includeDb, includeStorage });

  // generate the Pulumi.yaml file
  await generateProjectYaml({ projectName: componentName });

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
