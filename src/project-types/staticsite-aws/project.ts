import { fileExists, mkdirp } from '../../files'
import fs from 'fs/promises'
import path from 'path'

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
  return []
}

export const collectInput = async () => {
  return {}
}

export default async function staticSiteAws() {
  const [pulumiIndex] = await Promise.all([
    fs.readFile(path.join(__dirname, 'index.ts'), 'utf-8'),
    copyScripts(),
    ensureDeployCommand(),
  ])

  return pulumiIndex
}

export const copyScripts = async () => {
  const scriptsPath = path.join('infrastructure', 'scripts')
  await mkdirp(scriptsPath)
  await fs.copyFile(path.join(__dirname, 'scripts', 'deploy.sh'), path.join(scriptsPath, 'deploy.sh'))
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