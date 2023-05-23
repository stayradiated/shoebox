import { z } from 'zod'

export const $Package = z.object({
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
})
