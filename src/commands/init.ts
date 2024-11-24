import z from 'zod';
import { Command } from 'commander';
import prompts from 'prompts';
import path, { basename } from 'path';

import { detectFramework, FrameworkType, renderFramework, AllFrameworkTypes, importFramework, Framework } from '@/framework';
import { AllProjectTypes, importProject, LimgenProject, ProjectType, renderProject } from '@/project';
import { renderWorkspace } from '@/workspace';
import { bold, colorize, parseProcessArgs, spinner } from '@/cli-helpers';

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
  .option('-d, --directory <directory>', 'Directory where the infrastructure folder should be added', process.cwd())
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

    const projectType = await getProjectType(cmdArgs);
    const project = await importProject(projectType);
    const projectInputs = await collectProjectInputs(project, cmdArgs, projectType, frameworkType);

    const projectSpinner = spinner(`${bold('Initializing project')} …`).start();

    await renderProject(project, projectInputs);

    projectSpinner.succeed();

    if (AllFrameworkTypes.includes(frameworkType) && frameworkType !== 'unknown') {
      const frameworkSpinner = spinner(`${bold('Intializing framework')} ${colorize('yellow', frameworkType)} …`).start();

      const framework = await importFramework(frameworkType);
      const frameworkInputs = await collectFrameworkInputs(framework, cmdArgs, projectInputs);
      await renderFramework(framework, frameworkInputs);

      frameworkSpinner.succeed();
    }

    const cmdToRun = `(cd ${path.join('infrastructure', 'projects', projectInputs.projectName)} && pulumi up)`;
    await animateTyping(`Project ${colorize('cyan', projectInputs.projectName)} initialized successfully!`);
    await delay(500);
    await animateTyping(`To deploy your resources, run ${bold(cmdToRun)}\n`);
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

export async function collectProjectInputs(project: LimgenProject, cmdArgs: any, projectType: ProjectType, framework: FrameworkType) {
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
      initial: `${basename(cmdArgs.directory)}-${projectType}${framework !== 'unknown' ? '-'+framework : ''}`,
    });

    projectName = result.projectName;
  }

  const projectArgs = z.object(schema).parse(processArgs);
  const inputs = await project.collectInput(cmdArgs, projectArgs) as Object;

  return {
    projectName,
    projectType: cmdArgs.projectType,
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
  
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const animateTyping = async (message: string) => {
  // only log if we are in a TTY
  if (!process.stdout.isTTY) {
    process.stdout.write(`${message}\n`);
    return;
  }

  const minDelay = 10; // Minimum delay between "keypresses" in milliseconds
  const maxDelay = 45; // Maximum delay between "keypresses" in milliseconds
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  process.stdout.write("\n");

  for (let i = 0; i < message.length; i++) {
    const char = message[i];
    process.stdout.write(char); // Print one character at a time
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    await delay(randomDelay);
  }

  process.stdout.write("\n"); // Move to the next line after completing the animation
};