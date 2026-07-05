//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: [
      'src/api/schema.gen.ts',
      'eslint.config.js',
      'prettier.config.js',
      'vite.config.js',
    ],
  },
  ...tanstackConfig,
]
