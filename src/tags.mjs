import {
  join,
  resolve
} from 'node:path'

import glob from 'glob-all'

import {
  getRenderTagsCSV
} from './render.mjs'

import config from './config.mjs'

if (!config.has('origin')) throw new Error('No origin')

const ORIGIN = resolve(config.get('origin'))
const DESTINATION = join(resolve(config.get('destination') ?? ORIGIN), 'tags.csv')
const PATTERN = join(ORIGIN, '**/*.tif')

glob(PATTERN, getRenderTagsCSV(DESTINATION))
