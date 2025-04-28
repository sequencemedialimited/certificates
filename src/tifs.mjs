import {
  join,
  resolve
} from 'node:path'

import glob from 'glob-all'

import {
  getRenderFiles
} from './render.mjs'

import config from './config.mjs'

if (!config.has('origin')) throw new Error('No origin')
if (config.get('origin') === config.get('destination')) throw new Error('Origin and destination are the same')

const ORIGIN = resolve(config.get('origin'))
const DESTINATION = resolve(config.get('destination') ?? '.tifs')
const PATTERN = join(ORIGIN, '**/*.tif')

glob(PATTERN, getRenderFiles(DESTINATION))
