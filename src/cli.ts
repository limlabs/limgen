import fs from 'fs/promises';

/**
 * 1. Creates a new directory if not exists called infrastructure
 * 2. Adds a directory if not exists called components
 * 3. Creates a file called infrastructure/index.ts
 * 4. Write out command for standing up their new stack with the files in the infrastructure directory
 */
export async function cli() {
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
  
  // create infrastructure directory
  // create components directory
  await fs.mkdir('infrastructure/components', { recursive: true });


  // copy src/install/components/{componentName}.ts to $cwd/infrastructure/components/{componentName}.ts
  await fs.copyFile(`${__dirname}/install/components/${componentName}.ts`, `infrastructure/components/${componentName}.ts`);

  // copy install/infrastructure/index.ts 
  await fs.copyFile(`${__dirname}/install/index.ts`, `infrastructure/index.ts`);
}
