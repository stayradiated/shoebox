import { fetch } from 'undici'

type CheckUpdatesJsonOptions = {
  url: string
  path: Array<string|number>
}

const checkUpdatesJson = async (
  options: CheckUpdatesJsonOptions,
): Promise<string> => {
  const { url, path } = options

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })
  const body = await response.json() as unknown

  const version = path.reduce<unknown>((acc, key) => {
    if (typeof acc === 'object' && acc !== null && key in acc) {
      const value = (acc as Record<string,unknown>)[key]
      return value as unknown
    }
    throw new Error(`Could not find key ${key} in ${JSON.stringify(acc)}. Path: ${JSON.stringify(path)}`)
  }, body) as string

  return version
}

export { checkUpdatesJson }
