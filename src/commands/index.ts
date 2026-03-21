import type { CommandModule } from 'yargs'

import { default as add } from './add/index.ts'
import { default as build } from './build/index.ts'
import { default as checkUpdates } from './check-updates/index.ts'
import { default as diff } from './diff/index.ts'
import { default as generate } from './generate/index.ts'

const commandsList = [add, build, diff, generate, checkUpdates]

// Force type to CommandModule to fix typescript error
const commands = commandsList as unknown as CommandModule<
  Record<string, unknown>,
  unknown
>

export { commands }
