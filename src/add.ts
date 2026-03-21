import type { JsonMap } from '@iarna/toml'
import { stringify } from '@iarna/toml'
import { templates } from './add/index.ts'

type AddOptions = {
  name: keyof typeof templates
  type: string
}

const add = async (options: AddOptions) => {
  const { name, type } = options
  const template = templates[type]
  if (template == null) {
    throw new Error(`Could not find template with name: ${type}`)
  }

  const body = await template({ name })
  console.info(stringify(body as unknown as JsonMap))
}

export default add
