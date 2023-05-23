import yargs from 'yargs'
import { commands } from './commands/index.js'

yargs(process.argv)
  .strict()
  .demandCommand(1, 'You need to select at least one command to use this tool')
  .command(commands)
  .parse()
