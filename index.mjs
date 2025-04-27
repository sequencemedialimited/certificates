import {
  join
} from 'node:path'

import glob from 'glob-all'

import {
  getRenderStatsCSV,
  getRenderTagsCSV
} from './render.mjs'

import config from './config.mjs'

if (!config.has('origin')) throw new Error('No origin')

const ORIGIN = config.get('origin')
const DESTINATION = config.get('destination') ?? ORIGIN
const PATTERN = join(ORIGIN, '**/*.tif')

glob(PATTERN, getRenderStatsCSV(join(DESTINATION, 'stats.csv')))

glob(PATTERN, getRenderTagsCSV(join(DESTINATION, 'tags.csv')))
