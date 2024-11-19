import fs from 'fs/promises'


export const dockerfileExists = async () => {
  try {
    await fs.access('Dockerfile')
    return true
  } catch (error) {
    return false
  }
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