import { z } from 'zod'

const $Diff = z
  .object({
    exclude: z.array(z.string()),
  })
  .strict()

const $CheckUpdates = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('github-release'),
      url: z.string(),
      matchTag: z.string().optional(),
      removePrefix: z.string().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('github-commit'),
      url: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('github-tag'),
      url: z.string(),
      matchTag: z.string().optional(),
      removePrefix: z.string().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('npm'),
      packageName: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('apt'),
      name: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('json'),
      url: z.string(),
      path: z.array(z.string()),
    })
    .strict(),
])

const $Package = z.object({
  baseExportDir: z.string().optional(),
  build: z.string().optional(),
  command: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  env: z.array(z.tuple([z.string(), z.string()])).optional(),
  exportEnv: z.array(z.tuple([z.string(), z.string()])).optional(),
  exports: z.array(z.string()).optional(),
  from: z.string().optional(),
  fromImage: z.string().optional(),
  install: z.string().optional(),
  mount: z.array(z.tuple([z.string(), z.string()])).optional(),
  name: z.string(),
  user: z.string().optional(),
  version: z.string().optional(),
  workdir: z.string().optional(),
  checkUpdates: $CheckUpdates.optional(),
  diff: $Diff.optional(),
})

export { $Package }
