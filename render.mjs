/**
 *  @typedef {import('node:fs').Stats} Stats
 */

/**
 *  @typedef {string | number | Date} Stat
 */

/**
 *  @typedef {{ value?: string | number | string[] | number[] }} Tag
 */

import {
  stat,
  writeFile
} from 'node:fs/promises'

import ExifReader from 'exifreader'

import {
  json2csv as toCSV
} from 'json-2-csv'

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
    Software: software,
    'Device Manufacturer': deviceManufacturer,
    'Device Model Number': deviceModelNumber
  } = tags

  return {
    'File Path': filePath,
    'File Type': getValue(fileType),
    'Date Time': getValue(dateTime),
    'Image Width': getValue(imageWidth),
    'Image Length': getValue(imageLength),
    Compression: getValue(compression),
    Make: getValue(make),
    Model: getValue(model),
    Software: getValue(software),
    'Device Manufacturer': getValue(deviceManufacturer),
    'Device Model Number': getValue(deviceModelNumber)
  }
}

/**
 *  @param {string[] | number[]} value
 *  @returns {string | number}
 */
function getFirst ([first] = []) {
  return first
}

export function getRenderStatsCSV (destination = 'stats.csv') {
  /**
   *  @param {Error} [e]
   *  @param {string[]} [filePathList]
   */
  return async function renderStatsCSV (e, filePathList = []) {
    if (e) throw e

    const a = []

    for (const filePath of filePathList) {
      const stats = await stat(filePath)

      a.push(fromStats(filePath, stats))
    }

    await writeFile(destination, toCSV(a))
  }
}

/**
 *  @param {string} [destination]
 *  @returns {(e?: Error, filePathList?: string[]) => void}
 */
export function getRenderTagsCSV (destination = 'tags.csv') {
  /**
   *  @param {Error} [e]
   *  @param {string[]} [filePathList]
   */
  return async function renderTagsCSV (e, filePathList = []) {
    if (e) throw e

    const a = []

    for (const filePath of filePathList) {
      const tags = await ExifReader.load(filePath)

      a.push(fromTags(filePath, tags))
    }

    await writeFile(destination, toCSV(a))
  }
}
