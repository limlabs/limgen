import z from 'zod';
import { Command, Option } from 'commander';
import prompts from 'prompts';

export type NullableCliOption = 'true' | 'false' | 'unknown';

const cliBoolean = () => z.enum(['true', 'false', 'unknown'])
  .transform((val) => val !== 'unknown' 
    ? `${val === 'true'}` 
    : 'unknown');

import { detectFramework, getSupportedProjectTypesForFramework, FrameworkType } from '@/framework';
import { AllProjectTypes, copyFileDependencies, generateIndexFile, generateProjectYaml, importProject, installDependencies, ProjectType } from '@/project';
import { generatePackageJSON, initWorkspace } from '@/workspace';

const parseProcessArgs = (args: string[] = process.argv.slice(2)): Record<string, string> => {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    let [key, value] = args[i].split('=');
    if (!value && i + 1 < args.length && !args[i + 1].startsWith('-')) {
      value = args[++i];
    }
    if (key) {
      result[key.replace(/^--?/, '')] = value !== undefined ? value : 'true';
    }
  }
  return result;
};

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
    const parsedInitOptions = initOptionsSchema.parse(options);

    if (parsedInitOptions.directory) {
      process.chdir(parsedInitOptions.directory);
    }

    let projectName: string = parsedInitOptions.name as string;
    if (!projectName) {
      const result = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'Enter a project name',
        initial: 'my-project',
      });

      projectName = result.projectName;
    }

    let framework = parsedInitOptions.framework as FrameworkType;
    if (!framework) {
      framework = await detectFramework();
    }

    let projectType = parsedInitOptions.projectType as ProjectType;
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
    const cmdOpts = await project.options(initArgs);

    const schema = z.object(cmdOpts.reduce((acc, opt) => {
      acc[opt.name] = opt.schema;
      return acc;
    }, {} as any));

    const processArgs = parseProcessArgs();
    for (const opt of cmdOpts) {
      if (processArgs[opt.name] === undefined) {
        processArgs[opt.name] = 'unknown';
      }
    }

    const parsedOptions = schema.parse(processArgs);
    

    const opts = await project.collectInput(initArgs, parsedOptions);
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