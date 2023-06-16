import type { CommandModule } from 'yargs'
import * as add from './add/index.js'
import * as build from './build/index.js'
import * as diff from './diff/index.js'
import * as generate from './generate/index.js'
import * as checkUpdates from './check-updates/index.js'

const commandsList = [add, build, diff, generate, checkUpdates]

// Force type to CommandModule to fix typescript error
const commands = commandsList as unknown as CommandModule<
  Record<string, unknown>,
  any
>

export { commands }
