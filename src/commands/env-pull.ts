import { AllProjectTypes, importProjectType, ProjectType, readProjectMetadata } from "@/project";
import { Command } from "commander";
import { z } from 'zod';
import fs from 'fs/promises';
import path from "path";
import prompts from "prompts";
import { spinner } from "@/cli-helpers";
import { execPromise } from "@/utils/exec";

const envPullOptionsSchema = z.object({
  project: z.string().optional(),
  stack: z.string().optional(),
  directory: z.string().optional(),
});

export type EnvPullOptions = z.infer<typeof envPullOptionsSchema>;

export const envPull = new Command()
  .name('env-pull')
  .description('Pull project environment variables into a local .env file')
  .option('-p, --projectName <project>', 'Name of the project to pull environment variables from')
  .option('-s, --stack <stack>', 'Name of the stack to pull environment variables from')
  .option('-d, --directory <directory>', 'Directory for the base infrastructure folder')
  .action(async (options: any) => {
    const cmdArgs = envPullOptionsSchema.parse({ options });
    if (options.directory) {
      process.chdir(options.directory);
    }
    
    const projectName = await getProjectName(cmdArgs);
    const projectType = await getProjectType({ projectName });

    const project = await importProjectType(projectType);
    if (!project.envPull) {
      throw new Error(`Project type ${projectType} does not support env-pull`);
    }

    const stack = await getStackName({
      projectName,
      stack: cmdArgs.stack,
    });

    const msg = spinner(`Pulling environment variables for ${projectName} stack ${stack}`).start();
    await project.envPull({
      projectName, 
      stack,
    });

    msg.succeed(`Environment variables pulled for ${projectName} stack ${stack}`);
  });

async function getProjectName(cmdArgs: EnvPullOptions): Promise<string> {
  if (cmdArgs.project) {
    return cmdArgs.project;
  }

  // get the project name from a prompt by reading what's in the infrastructure folder relative to ${directory}
  const projects = await fs.readdir('infrastructure/projects');

  // use a prompt from prompts() furnction
  const { projectName } = await prompts({
    type: 'select',
    name: 'projectName',
    message: 'Select a project',
    choices: projects.map((project) => ({ title: project, value: project })),
  });

  return projectName;
}

async function getProjectType(
  { projectName }: { projectName: string }): Promise<ProjectType> {
  const metadata = await readProjectMetadata({
    projectName: projectName,
  });

  if (!AllProjectTypes.includes(metadata.projectType as ProjectType)) {
    throw new Error(`Unsupported project type: ${metadata.projectType}`);
  }

  return metadata.projectType as ProjectType;
}

async function getStackName(opts: { projectName: string; stack?: string; }) {
  if (opts.stack) {
    return opts.stack;
  }

  const { stdout } = await execPromise('pulumi stack ls --json', {
    cwd: path.join('infrastructure', 'projects', opts.projectName)
  });

  const stacks = JSON.parse(stdout);
  if (stacks.length === 0) {
    throw new Error('No stacks found');
  }

  const { stackName } = await prompts({
    type: 'select',
    name: 'stackName',
    message: 'Select a stack',
    choices: stacks.map((stack: any) => ({ title: stack.name, value: stack.name })),
  });

  return stackName;
}
