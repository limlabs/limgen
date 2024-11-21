# Limgen

Limgen is an infrastructure-as-code (IaC) generator for full-stack applications. Inspired by [@shadcn/ui](https://ui.shadcn.com/), this tool aims to set up a well-crafted, maintainable infrastructure  workflow inside of your project. 

## NextJS Quickstart

To initialize an existing Next.js app with limgen, follow these steps:

```bash
# install latest version of pulumi if you don't already have it
curl -fsSL https://get.pulumi.com | sh 

# 1. enter your next project directory
cd my-app

# 2. run the init command
npx limgen init -n my-app

# 3. Deploy your new fullstack application!
cd infrastructure/your-project && pulumi up 
```

Note that you may need to install additional tools, such as the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), when using providers that require cloud-specific authentication.

## Why Limgen?

Limgen helps you get started on the right foot with your infrastructure, then gets out of the way.

Limgen is ideal for situations where:

- You know full stack development in a language like Typescript or PHP, but are new to DevOps
- You've tried one-liners like `sst`, or plugins; they don't work, and you have no idea why
- Your team handles its DevOps and you need to be able to troubleshoot / fix your own infrastructure

For cases where shared dependencies are essential, limgen supports extension via custom project and framework definitions (coming soon), giving the best of both worlds: the benefits of limgen's organization and workflow, applied to your pre-existing components/modules.

## How It Works

Unlike other shared IaC tools, Limgen is not a library. You cannot install it into your project with NPM or Homebrew. 

Instead, Limgen defines a standard layout and components for you to use with [Pulumi](https://www.pulumi.com/product/infrastructure-as-code/), a popular open-source IaC framework. The `limgen` CLI generates working code into your repository by trying to detect what will work best, based on the tools you're using (such as Docker or NextJS), and configuring your existing files to work automatically with your new infrastructure. 

When more info is needed, provides an intuitive, interactive prompt to generate the right configuration for your project, based on your use case.

The result is infrastructure that's easy to inspect, troubleshoot, track, review, and customize to meet your applications' privacy, security, and scale requirements over time. 

## Examples

Ligmen contains a number of examples designed to showcase its utility for common scenarios, such as needing a database or blob storage.

Check out the [examples](./examples/) folder for a list of several officially-maintained and tested use cases. Each `Readme.md` should contain instructions on how to get the project up and running.

## Concepts

### Project

A Pulumi infrastructure [project](https://www.pulumi.com/docs/iac/concepts/projects/) with its own lifecycle.

In Pulumi, each project has one or more "stacks", which is essentially its own environment.

Each project folder has the following layout:

```
project/
    index.ts # The entry point where pulumi resources are declared
    Pulumi.yaml # The Pulumi configuration file generated when running pulumi init or limgen init
    # ... other project-specific files
```

#### Project Types

Each project has a **project type**. A project type is an archetype for a specific arrangement of Pulumi resources. In practical terms, project types are used to help quickly bootstrap for common / repeating use cases. These include static sites or Docker services deployed to a specific platform such as AWS.

**Coming soon**

There are two categories of project type: built-in and custom. Both follow the same principles but are separated by one core difference: built-in project types are included with limgen and maintained by the limgen core team, whereas custom project types are user-defined.

#### Built-in Project Types

The current project types can be found [here](./src/projects/).

Built-in project types can be used by passing them as options to `limgen init`. For example:

```bash
npx limgen init --projectType fullstack-aws  # or 'limgen init -t fullstack-aws'
```

This will create a new project of type `fullstack-aws`, which contains all of the resources, including Blob storage and DB, needed to deploy a Docker-based application to AWS.

<a href="#single-vs-multiple-projects"></a>
#### Single vs. Multiple Projects

Multiple projects are often used to split the lifecycle of the infrastructure. For instance, one may choose to update the database servers at a different interval from the application itself:

```
infrastructure/
    projects/
        database/ # manage the database-related resource lifecycle
        app/ # manage the application without checking database properties
```

The decision of when to use single vs. multiple projects is largely up to the user. Each project generated by `limgen init` currently is designed to work independently of the others, though this may evolve in the future.

Keep in mind that while splitting projects later is possible, it's kind of painful. So after experimenting with the infrastructure components you want to use, head to the whiteboard and plan out how you want to manage your infrastructure long-term before going to production.

### Framework

A **framework** in Limgen refers to a set of development platform-specific constraints applied to one or more project types. Frameworks allow projects to be customized and configured automatically to work with popular, community-adopted tools like NextJS or Laravel.

One common task for frameworks is to modify framework-specific files, such as `next.config.ts`, or to generate standard files known to be compatible with that framework, such as a Dockerfile template.

A list of built-in frameworks is available [here](./src/frameworks/)

### Workspace

In Limgen, workspaces are conventionally defined by the contents of the `infrastructure` folder. Workspaces contain the following layout:

```
infrastructure/
    components/ # where infrastructure components go
    projects/ # where projects are defined
    utils/ # where utilities for IaC components go 
```

Workspaces can contain multiple projects. While each project is maintained separately, it can often be helpful to share code and utilities across projects within the same repository.

Currently, workspaces are primarily useful for two reasons:

1. Introduces a set of conventions to keep infrastructure organized and consistent
1. Some users may want to update different groups of infrastructure at different times. A common use case for this is to define a shared resource used by multiple application stacks, such as a database server or load balancer. For more information, see the [Single vs. Multiple Projects](#single-vs-multiple-projects) section in this documentation.

#### Workspace Location

Workspaces are meant to be subfolders of the project they are managing. For example. if you are building a NextJS application, the folder layout could be similar to the following:

```
<projectRoot>
    app/ # or src/app
    infrastructure/
    package.json
    tsconfig.json
    ... other NextJS files
```

## CLI Reference

To run the `limgen` CLI in interactive mode, use the following syntax:

`npx limgen <subcommand> [options]`

Note: `limgen` accepts all interactive options as CLI parameters, allowing interactive mode to be skipped. This can be useful for automation and scripting.

### Commands


#### `init`

```bash
npx limgen init [options]
```

Initializes a new project from (eventually) one of several project types. Right now the only supported project type is `fullstack-aws`. Creates a workspace if it doesn't already exist.

##### Options

- **directory** - the working directory where limgen will execute. Defaults to `process.cwd()`
- **name** - the name of the project. This will create a folder in `${directory}/infrastructure/<name>` where the `Pulumi.yaml` and `index.ts` files are located, and where `pulumi` can be invoked to manage a stack
- **projectType** - The type of project that will be created. Currently `aws-fullstack` is supported. The default behavior is to auto-detect the correct project type, based on the detected framework and any other artifacts that make it eligible for a specific type, such as a Dockerfile.
- **framework** - The framework to apply to the initialization. Frameworks have different behaviors that modify files in `${directory}`, and in the workspace (`${directory}/infrastructure`). For example, the `nextjs` framework modifies the `next.config.ts` file to use the appropriate [output](https://nextjs.org/docs/app/api-reference/next-config-js/output) flag. Defaults to auto-detecting based on well-known conventions for usage within each respective ecosystem.

##### Project Type-Specific Options

The following options only apply to their respective project types, provided interactively or via the `-t` / `--projectType` argument.

**`fullstack-aws` Options**

- **port** - the port to listen on. If a `Dockerfile` is detected in `${directory}`, it will default to using the value of the Docker [`EXPOSE` instruction](https://docs.docker.com/reference/dockerfile/#expose).
- **includeStorage** - whether to include object storage or not. When set to `true`, an S3 bucket will be created that is available from your application's URL under the root path `/storage`. Defaults to prompt for confirmation.
- **includeDb** - whether to include a database or not. If set to `true`, includes the resources to create an [RDS Postgres](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html) server in AWS. Currenty only RDS Postgres is supported, but more cloud providers and datbase types will be added soon. Default to prompt for confirmation.

#### `add`

```
npx add <component> [options]
```

Adds a new component to the `infrastructure/components` folder. Components are usually imported into one or more projects inside the `infrastructure/projects` folder and used alongside other resources from `@pulumi/aws`, `@pulumi/awsx` and others directly.

**Arguments**

- `<component>` - the name of a component to add to your workspace. Supported components can be found [here](./src/components/)

## Local Development

### Prerequisites

1. [Pulumi](https://www.pulumi.com/docs/iac/download-install/)
1. [NVM](https://github.com/nvm-sh/nvm)
1. [pnpm](https://pnpm.io/installation)

### Setup

1. Clone the repo
1. `nvm install 22`
1. `nvm use 22`
1. `pnpm install`

### Running Commands

`pnpm dev <subcommand>` will run a command and output in `<repoRoot>/infrastructure`, which is gitignored.

Unlike using the linked or installed version, this does not require running `pnpm build` first.

### Run the unit tests

`pnpm test`

### Update the examples

This command will udpdate the files in each of the `examples/<name>/infrastructure` workspaces by invoking the CLI:

`scripts/update-examples.sh`

Updating the examples can be useful as a sort of "integration test" to make sure that the application executes for each intended use case.

## TODOS

Must have:

- [ ] Cloudfront --> S3 configuration
- [ ] Private networking option

Like to have:

- Improve default project name
- Static site aws project
- NextJS static site example
- Resource - Bastion
- Only copy dependencies that are needed
- Project Option - Private Networking
- Extensibility - allow custom-defined frameworks, projects, workspaces using a standard lifecycle appropriate to each resource type.

Help Wanted:

- Multiple language support
- Example - Laravel
- DB Provider - Prisma
- DB Provider - Supabase
- DB Provider - Vercel
- DB Provider - Fly.io
- App Provider - AWS Lambda
- App Provider - Fly.io
- App Provider - Netlify
- App Provider - Vercel
- App Provider - Azure AKS
- Storage Provider - Vercel
- Storage Provider - Tigris
- CDN Provider - Cloudflare
