/**
 *  @typedef {import('node:fs').Stats} Stats
 *  @typedef {string | number | Date} Stat
 *  @typedef {{
 *    value?: string | number | string[] | number[]
 *  }} Tag
 */

import {
  stat,
  writeFile,
  copyFile
} from 'node:fs/promises'

import {
  parse,
  join
} from 'node:path'

import {
  rimraf
} from 'rimraf'

import {
  ensureDir
} from 'fs-extra'

import ExifReader from 'exifreader'

import {
  json2csv as toCSV
} from 'json-2-csv'

/**
 * @param {string} dateTime
 * @returns {string}
 */
function transformForDate (dateTime) {
  return (
    dateTime
      .replace(
        /(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
        '$1 $2 $3 $4:$5:$6'
      )
  )
}

/**
 *  @param {Tag} tag
 *  @returns {string}
 */
function getValue ({ value } = {}) {
  if (Array.isArray(value)) {
    return toString(getFirst(value))
  }

  return toString(value)
}

/**
 *  @param {string | number} [value]
 *  @returns {string}
 */
function toString (value) {
  switch (typeof value) {
    case 'string':
      return value.replace(/\x00/g, String.fromCodePoint(32)).trim() || '-'
    case 'number':
      return String(value || 0)
    default:
      return '-'
  }
}

/**
 *  @param {string} filePath
 *  @param {Stats} stats
 *  @returns {Record<string, Stat>}
 */
function fromStats (filePath, stats) {
  return {
    'File Path': filePath,
    Size: stats.size,
    'Accessed Time': stats.atime.toISOString(),
    'Accessed Time (ms)': stats.atimeMs,
    'Modified Time': stats.mtime.toISOString(),
    'Modified Time (ms)': stats.mtimeMs,
    'Created Time': stats.ctime.toISOString(),
    'Created Time (ms)': stats.ctimeMs,
    'Birth Time': stats.birthtime.toISOString(),
    'Birth Time (ms)': stats.birthtimeMs
  }
}

/**
 *  @param {string} filePath
 *  @param {Record<string, Tag | undefined>} tags
 *  @returns {Record<string, string>}
 */
function fromTags (filePath, tags) {
  const {
    FileType: fileType,
    DateTime: dateTime,
    ImageWidth: imageWidth,
    ImageLength: imageLength,
    Compression: compression,
    Make: make,
    Model: model,
    Software: software
  } = tags

  const v = getValue(dateTime)
  const s = transformForDate(v)
  const d = new Date(s)
  const n = d.valueOf().toString()

  return {
    'File Path': filePath,
    'File Type': getValue(fileType),
    'Date Time': d.toISOString(),
    'Date Time (ms)': n,
    'Image Width': getValue(imageWidth),
    'Image Length': getValue(imageLength),
    Compression: getValue(compression),
    Make: getValue(make),
    Model: getValue(model),
    Software: getValue(software)
  }
}

/**
 *  @param {string[] | number[]} value
 *  @returns {string | number}
 */
function getFirst ([first] = []) {
  return first
}

/**
 *  @param {string} [destination]
 *  @returns {(e?: Error, filePathList?: string[]) => void}
 */
export function getRenderStatsCSV (destination = '.csvs/stats.csv') {
  /**
   * @param {string} filePath
   * @returns {Promise<Record<string, Stat>>}
   */
  async function render (filePath) {
    const stats = await stat(filePath)

    return (
      fromStats(
        filePath,
        stats
      )
    )
  }

  /**
   *  @param {Error} [e]
   *  @param {string[]} [filePathList]
   */
  return async function renderStatsCSV (e, filePathList = []) {
    if (e) throw e

    const d = await Promise.all(filePathList.map(render))

    await writeFile(destination, toCSV(d))
  }
}

/**
 *  @param {string} [destination]
 *  @returns {(e?: Error, filePathList?: string[]) => void}
 */
export function getRenderTagsCSV (destination = '.csvs/tags.csv') {
  /**
   *  @param {string} filePath
   */
  async function render (filePath) {
    const tags = await ExifReader.load(filePath)

    return (
      fromTags(
        filePath,
        tags
      )
    )
  }

  /**
   *  @param {Error} [e]
   *  @param {string[]} [filePathList]
   */
  return async function renderTagsCSV (e, filePathList = []) {
    if (e) throw e

    const d = await Promise.all(filePathList.map(render))

    await writeFile(destination, toCSV(d))
  }
}

/**
 *  @param {string} fileRoot
 *  @param {Map<string, Set<string>>} map
 *  @returns {Promise<void>}
 */
async function renderFiles (fileRoot, map) {
  await ensureDir(fileRoot)

  for (const [key, set] of map) {
    const directory = join(fileRoot, key)

    await ensureDir(directory)

    if (set.size > 1) {
      await Promise.all(Array.from(set).map((origin, index) => {
        const destination = join(directory, `${key} (${index + 1}).tif`)

        return (
          copyFile(origin, destination)
        )
      }))
    } else {
      await Promise.all(Array.from(set).map((origin) => {
        const destination = join(directory, `${key}.tif`)

        return (
          copyFile(origin, destination)
        )
      }))
    }
  }
}

/**
 *  @param {string} [fileRoot]
 *  @returns {(e?: Error, filePathList?: string[]) => void}
 */
export function getRenderFiles (fileRoot = '.tifs') {
  /**
   *  @param {Map<string, Set<string>>} map
   *  @param {string} filePath
   *  @returns {Map<string, Set<string>>}
   */
  function toMap (map, filePath) {
    const {
      name
    } = parse(filePath)

    const key = name.replace(/(.*) \(\d+\)|(.*)/, ($1, $2) => $1 ?? $2)

    if (map.has(key)) { // @ts-ignore
      map.get(key).add(filePath)
    } else {
      map.set(key, new Set([filePath]))
    }

    return map
  }

  /**
   *  @param {Error} [e]
   *  @param {string[]} [filePathList]
   */
  return async function render (e, filePathList = []) {
    await rimraf(fileRoot)

    const map = filePathList.reduce(toMap, new Map())

    await renderFiles(fileRoot, map)
  }
}
