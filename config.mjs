import yargsParser from 'yargs-parser'

const {
  argv = []
} = process

export const args = argv.slice(2)

export default new Map(Object.entries(yargsParser(args)))
