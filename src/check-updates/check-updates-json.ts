import { fetch } from 'undici'

type CheckUpdatesJsonOptions = {
  url: string
  path: Array<string | number>
}

const checkUpdatesJson = async (
  options: CheckUpdatesJsonOptions,
): Promise<string> => {
  const { url, path } = options

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  const bodyJSON = await response.text()
  let body: unknown
  try {
    body = JSON.parse(bodyJSON)
  } catch (error: unknown) {
    console.log(`----\n${bodyJSON}\n----`)
    throw new Error(`Could not parse JSON from ${url}.\nError: ${error}`)
  }

  const version = path.reduce<unknown>((accumulator, key) => {
    if (
      typeof accumulator === 'object' &&
      accumulator !== null &&
      key in accumulator
    ) {
      const value = (accumulator as Record<string, unknown>)[key]
      return value
    }

    throw new Error(
      `Could not find key ${key} in ${JSON.stringify(
        accumulator,
      )}. Path: ${JSON.stringify(path)}`,
    )
  }, body) as string

  return version
}

export { checkUpdatesJson }
