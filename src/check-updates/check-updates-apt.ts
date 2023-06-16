import { execa } from 'execa'

type CheckUpdatesAptOptions = {
  name: string
}

const checkUpdatesApt = async (options: CheckUpdatesAptOptions) => {
  const { name } = options

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

  const versionList = [...new Set(versionListWithDuplicates)]
  console.log(versionList)

  const version = versionList[0]
  if (!version) {
    throw new Error(`Unable to find version for ${name}`)
  }

  return version
}

export { checkUpdatesApt }
