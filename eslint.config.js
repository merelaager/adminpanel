//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [{ ignores: ['src/api/schema.gen.ts'] }, ...tanstackConfig]
