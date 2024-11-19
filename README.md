# Limgen

Limgen is an infrastructure-as-code (IaC) generator for full-stack applications. Inspired by [@shadcn/ui](https://ui.shadcn.com/), this tool aims to create maintainable infrastructure inside of your project. 

Unlike other tools, Limgen does not wrap your infrastructure in abstractions. We define a standard layout and components for you to use with [Pulumi](https://www.pulumi.com/product/infrastructure-as-code/), a popular open-source IaC framework. This allows you to start with working code, and customize it to meet your applications' resource, security, and maintenance needs over time.

## NextJS Quickstart

```bash
curl -fsSL https://get.pulumi.com | sh # install latest version of pulumi (optional)
npx create-next-app # create a new next app (optional)
cd create-next-app # enter your next project directory
npx limgen init # run the project init subcommand
cd infrastructure/your-project && pulumi up # create your new fullstack application!
```

## Usage

`npx limgen [subcommand]`

### Available subcommands

- `init` - Initializes a new project from (eventually) one of several project types. Right now the only supported project type is `fullstack-aws`. Creates a workspace if it doesn't already exist.
- `add <component>` - Adds a new component to the `infrastructure/components` folder. Components are usually imported into one or more projects inside the `infrastructure/projects` folder.

## Concepts

### Workspace

In Limgen, workspaces are conventionally defined by the contents of the `infrastructure` folder. Workspaces contain the following layout:

```
infrastructure/
    components/ # where infrastructure components go
    projects/ # where projects are defined
    utils/ # where utilities for IaC components go 
```

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

In a monorepo, there two main approaches:

1. Add `infrastructure/` to each deployable workspace
2. Add an `infrastructure/` folder to the root of the repo

It is in theory possible, but untested, to add a Limgen workspace as a workspace within a monorepo directly.

### Project

A Pulumi infrastructure project with its own lifecycle.

In Pulumi, each project has one or more "stacks", which is essentially its own environment.

Each project folder has the following layout:

```
project/
    index.ts # The entry point where pulumi resources are declared
    Pulumi.yaml # The Pulumi configuration file generated when running pulumi init or limgen init
    Pulumi.<stackName>.yaml # Configuration for a specific stack (environment) within the project
```

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

- [ ] Documentation
- [ ] Cloudfront --> S3 configuration
- [ ] Private networking option

Like to have:

- Static site aws project
- NextJS static site example
- Resource - Bastion
- Only copy dependencies that are needed
- Project Option - Private Networking

Help Wanted:

- Read port automatically from Dockerfile
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
