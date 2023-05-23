import { stringify } from '@iarna/toml'
import type { JsonMap } from '@iarna/toml'
import * as untypedTemplates from './add/index.js'
import type { TemplateFn } from './add/types.js'

const templates = untypedTemplates as Record<string, TemplateFn>

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
  console.log(stringify(body as unknown as JsonMap))
}

export default add
