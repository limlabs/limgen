import fs from 'fs/promises'
import { fileExists } from './files'

export const dockerfileExists = async () => {
  return await fileExists('Dockerfile')
}

export const getDockerfilePort = async () => {
  let detectedPort = null

  if (!(await dockerfileExists())) {
    return detectedPort
  }

  const dockerfile = await fs.readFile('Dockerfile', 'utf8')
  const match = dockerfile.match(/EXPOSE (\d+)/)
  if (match) {
    detectedPort = parseInt(match[1])
  }

  return detectedPort
}