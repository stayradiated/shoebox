import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { commands } from './commands/index.js'

yargs(hideBin(process.argv))
  .strict()
  .demandCommand(1, 'You need to select at least one command to use this tool')
  .command(commands)
  .parse()
