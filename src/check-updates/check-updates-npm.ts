import { fetch } from 'undici'
import { z } from 'zod'

const $Response = z.object({
  'dist-tags': z.object({
    latest: z.string(),
  }),
})

type CheckUpdatesNpmOptions = {
  packageName: string
}

const checkUpdatesNpm = async (options: CheckUpdatesNpmOptions) => {
  const { packageName } = options

  const packageUrl = `https://registry.npmjs.org/${packageName}`
  const response = await fetch(packageUrl)
  const rawBody = await response.json()
  const body = $Response.parse(rawBody)

  const version = body['dist-tags'].latest

  return version
}

export { checkUpdatesNpm }
