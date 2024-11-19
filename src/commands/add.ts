import fs from 'fs/promises';
import { doesComponentExist, ensureComponentsDirectory } from "@/component";
import { copyFileDependencies } from "@/files";
import { extractImports } from "@/typescript";
import { Command } from "commander";
import { installDependencies } from '@/npm';

export const add = new Command()
  .name('add')
  .description('Add a new component to the workspace')
  .argument('<component>', 'Name of the component to add')
  .action(async (component: string) => {
    if (!doesComponentExist(component)) {
      throw new Error(`Component ${component} does not exist`);
    }

    await ensureComponentsDirectory();
    console.log(`Adding component ${component}...`);

    const path = `components/${component}.ts`;
    await copyFileDependencies([path]);
    const code = await fs.readFile(`${__dirname}/../${path}`, 'utf8');
    let imports = await extractImports(code);

    await installDependencies(imports);

    console.log(`Component ${component} added successfully ✅`);
    console.log("Import this component to one or more projects' index files and deploy your new resources using `pulumi up`");
  });