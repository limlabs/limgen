import { BaseProjectInputOptions } from '@/project'
import { fileExists, mkdirp } from '../../files'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import ejs from 'ejs'

export const dependsOn = () => {
  const files = [
    'components/storage-s3.ts',
    'components/cdn-cloudfront.ts',
    'utils/deep-merge.ts',
    'utils/prefixed.ts',
  ]

  const packages = [
    '@pulumi/aws',
    '@pulumi/awsx',
    '@pulumi/pulumi',
    'zod',
  ]

  return {
    files,
    packages,
  }
}

export const inputs = async () => {
  return [
    {
      name: 'outputDir',
      message: 'Build output directory',
      schema: z.string().default('out'),
    }
  ]
}

interface StaticSiteAwsProjectInputOptions extends BaseProjectInputOptions {
  outputDir: string
}

export const collectInput = async (cmdArgs: any, projectArgs: any) => {
  let outputDir = projectArgs.outputDir
  if (!outputDir || outputDir === 'unknown') {
    outputDir = 'out'
  }
  
  return {
    outputDir,
  }
}

export default async function staticSiteAws(input: StaticSiteAwsProjectInputOptions) {
  const [pulumiIndex] = await Promise.all([
    fs.readFile(path.join(__dirname, 'index.ts'), 'utf-8'),
    copyScripts(input),
    ensureDeployCommand(),
  ])

  return pulumiIndex
}

export const copyScripts = async (input: StaticSiteAwsProjectInputOptions) => {
  const scriptsPath = path.join('infrastructure', 'scripts')
  await mkdirp(scriptsPath)

  const result = await ejs.renderFile(path.join(__dirname, 'scripts', 'deploy.sh.ejs.t'), input)
  await fs.writeFile(path.join(scriptsPath, 'deploy.sh'), result)
}

export const ensureDeployCommand = async () => {
  if (!await fileExists('package.json')) {
    return // we only support creating commands in package.json right now
  }

  const packageJSON = JSON.parse(await fs.readFile('package.json', 'utf-8'))
  if (!packageJSON.scripts) {
    packageJSON.scripts = {}
  }

  packageJSON.scripts['deploy-site'] = 'bash infrastructure/scripts/deploy.sh'

  await fs.writeFile('package.json', JSON.stringify(packageJSON, null, 2))
}