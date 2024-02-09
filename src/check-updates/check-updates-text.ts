import { fetch } from 'undici'

type CheckUpdatesTextOptions = {
  url: string
}

const checkUpdatesText = async (
  options: CheckUpdatesTextOptions,
): Promise<string> => {
  const { url } = options

  const response = await fetch(url, {
    headers: {
      Accept: '*/*',
    },
  })
  const version = await response.text()
  return version
}

export { checkUpdatesText }
