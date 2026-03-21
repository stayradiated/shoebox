import { execa } from 'execa'

type CheckUpdatesAptOptions = {
  name: string
  ignoreVersions?: string[]
}

const checkUpdatesApt = async (options: CheckUpdatesAptOptions) => {
  const { name, ignoreVersions = [] } = options

  const { stdout } = await execa('apt-cache', ['madison', name])

  const versionListWithDuplicates = stdout
    .split('\n')
    .map((line) => {
      const columns = line.split(' | ')
      const version = columns[1]
      if (!version) {
        return undefined
      }

      return version.trim()
    })
    .filter((version): version is string => {
      return version !== undefined
    })
    .filter((version) => {
      const isIgnored = ignoreVersions.includes(version)
      return isIgnored === false
    })

  const versionList = [...new Set(versionListWithDuplicates)]

  const version = versionList[0]
  if (!version) {
    throw new Error(`Unable to find version for ${name}`)
  }

  return version
}

export { checkUpdatesApt }
