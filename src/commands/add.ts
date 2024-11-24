import fs from 'fs/promises';
import { doesComponentExist, ensureComponentsDirectory } from "@/component";
import { copyFileDependencies } from "@/files";
import { extractImports } from "@/typescript";
import { Command } from "commander";
import { installDependencies } from '@/npm';
import { z } from 'zod';

const addOptionsSchema = z.object({
  component: z.string(),
  directory: z.string().optional().default(process.cwd()),
});

export const add = new Command()
  .name('add')
  .description('Add a new component to the workspace')
  .argument('<component>', 'Name of the component to add')
  .option('-d, --directory <directory>', 'Directory for the base infrastructure folder where the component should be added', process.cwd())
  .action(async (component: string, options: any) => {
    const cmdArgs = addOptionsSchema.parse(options);
    if (!doesComponentExist(component)) {
      throw new Error(`Component ${component} does not exist`);
    }

    await ensureComponentsDirectory();
    console.log(`Adding component ${component}...`);

    const path = `components/${component}.ts`;
    await copyFileDependencies([path]);
    const code = await fs.readFile(`${__dirname}/../${path}`, 'utf8');
    let imports = await extractImports(code);

    await installDependencies(cmdArgs.directory, imports);

    console.log(`Component ${component} added successfully ✅`);
    console.log("Import this component to one or more projects' index files and deploy your new resources using `pulumi up`");
  });