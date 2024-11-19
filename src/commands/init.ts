import z from 'zod';
import { Command } from 'commander';
import prompts from 'prompts';

import { detectFramework, getSupportedProjectTypesForFramework, FrameworkType, renderFramework, AllFrameworkTypes, importFramework, Framework } from '@/framework';
import { AllProjectTypes, importProject, LimgenProject, ProjectType, renderProject } from '@/project';
import { renderWorkspace } from '@/workspace';
import { parseProcessArgs } from '@/cli-helpers';
import path from 'path';

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
    const cmdArgs = initOptionsSchema.parse(options);

    if (cmdArgs.directory) {
      process.chdir(cmdArgs.directory);
    }

    let frameworkType = cmdArgs.framework as FrameworkType;
    if (!frameworkType) {
      frameworkType = await detectFramework();
    }

    await renderWorkspace();

    let projectType = await getProjectType(cmdArgs);
    const project = await importProject(projectType);
    const projectInputs = await collectProjectInputs(project, cmdArgs, frameworkType);

    console.log('Initializing project...');
    await renderProject(project, projectInputs);

    if (AllFrameworkTypes.includes(frameworkType) && frameworkType !== 'unknown') {
      console.log(`Detected framework: ${frameworkType}, initializing...`);
      const framework = await importFramework(frameworkType);
      const frameworkInputs = await collectFrameworkInputs(framework, cmdArgs, projectInputs);
      await renderFramework(framework, frameworkInputs);
    }

    console.log('Project initialized successfully!');
    console.log(`To start working on your project, run \`cd ${path.join('infrastructure', 'projects', projectInputs.projectName)} && pulumi up\``);
  });

export async function getProjectType(cmdArgs: z.infer<typeof initOptionsSchema>) {
  if (cmdArgs.projectType) {
    return cmdArgs.projectType;
  }

  const answer = await prompts({
    type: 'select',
    name: 'projectType',
    message: 'Select a project type',
    choices: AllProjectTypes.map((type) => ({ title: type, value: type })),
  });

  return answer.projectType;
}


export async function collectProjectInputs(project: LimgenProject, cmdArgs: any, framework: FrameworkType) {
  const projectInput = await project.inputs(cmdArgs);
  const schema = projectInput.reduce((acc, opt) => {
    acc[opt.name] = opt.schema;
    return acc;
  }, {} as any);

  const processArgs = parseProcessArgs();
  for (const opt of projectInput) {
    if (processArgs[opt.name] === undefined) {
      processArgs[opt.name] = 'unknown';
    }
  }

  let projectName: string = cmdArgs.name as string;
  if (!projectName) {
    const result = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Enter a project name',
      initial: 'my-project',
    });

    projectName = result.projectName;
  }

  let projectType = cmdArgs.projectType as ProjectType;
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

  const projectArgs = z.object(schema).parse(processArgs);
  const inputs = await project.collectInput(cmdArgs, projectArgs) as Object;

  return {
    projectName,
    projectType,
    ...inputs,
  };
}

export async function collectFrameworkInputs(framework: Framework, cmdArgs: any, projectInput: any) {
  const frameworkInput = await framework.inputs(cmdArgs, projectInput);
  const schema = frameworkInput.reduce((acc, opt) => {
    acc[opt.name] = opt.schema;
    return acc;
  }, {} as any);

  const processArgs = parseProcessArgs();

  for (const opt of frameworkInput) {
    if (processArgs[opt.name] === undefined) {
      processArgs[opt.name] = 'unknown';
    }
  }

  const frameworkArgs = z.object(schema).parse(processArgs);
  const inputs = await framework.collectInput(cmdArgs, projectInput, frameworkArgs) as Object;
  return inputs;
}