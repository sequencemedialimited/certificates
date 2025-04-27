import globals from 'globals'
import standard from '@sequencemedia/eslint-config-standard/merge'

export default [
  ...standard({
    rules: {
      'no-control-regex': 'off'
    },
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  })
]
