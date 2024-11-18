import z from 'zod';
import { Command } from 'commander';
import prompts from 'prompts';
import yargs from 'yargs';

import { detectFramework, getSupportedProjectTypesForFramework, FrameworkType } from '@/framework';
import { AllProjectTypes, copyFileDependencies, generateIndexFile, generateProjectYaml, importProject, installDependencies, ProjectType } from '@/project';
import { generatePackageJSON, initWorkspace } from '@/workspace';

export const initOptionsSchema = z.object({
  directory: z.string().optional(),
  name: z.string().optional(),
  framework: z.string().optional(),
  projectType: z.enum(AllProjectTypes).optional(),
});

export const init = new Command()
  .name('init')
  .allowUnknownOption(true)
  .description('Initialize a new infrastructure project')
  .option('-d, --directory <directory>', 'Directory where the infrastructure folder should be added')
  .option('-n, --name <name>', 'Name of the project')
  .option('-t, --projectType <type>', 'Type of project to create')
  .option('-f, --framework <framework>', 'Framework to use')
  .action(async (options) => {
    const parsedOptions = initOptionsSchema.parse(options);

    if (parsedOptions.directory) {
      process.chdir(parsedOptions.directory);
    }

    let projectName: string = parsedOptions.name as string;
    if (!projectName) {
      const result = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'Enter a project name',
        initial: 'my-project',
      });

      projectName = result.projectName;
    }

    let framework = parsedOptions.framework as FrameworkType;
    if (!framework) {
      framework = await detectFramework();
    }

    let projectType = parsedOptions.projectType as ProjectType;
    if (!projectType) {
      const supportedProjectTypes = await getSupportedProjectTypesForFramework(framework);

      const answer = await prompts({
        type: 'select',
        name: 'projectType',
        message: 'Select a project type',
        choices: AllProjectTypes.map((type) => ({
          title: `${type}${type === supportedProjectTypes[0] ? ' (Recommended)' : ''}`,
          value: type,
        })),
      });

      projectType = answer.projectType;
    }

    // import the project dynamically
    const initArgs = { projectName, framework };
    const project = await importProject(projectType);
    const cmdOpts = await project.getCommandOptions(initArgs);

    let command = new Command()
      .allowUnknownOption(true)
      .name(projectType)
      .action(async (subcommandOptions) => {
        const opts = await project.collectInput(initArgs, subcommandOptions);
        const { packages, files } = await project.dependsOn(opts);
  
        console.log('Initializing project...');
  
        await initWorkspace();
  
        await Promise.all([
          copyFileDependencies(files),
          generateIndexFile(project, opts),
          generatePackageJSON(),
          generateProjectYaml({ projectName }),
        ])
  
        await installDependencies(packages);
  
        console.log('Project initialized successfully!');
        console.log('To start working on your project, run `cd infrastructure && pulumi up`');
      });

    cmdOpts.forEach((opt) => {
      command = command.addOption(opt);
    });

    await command.parseAsync();
  });