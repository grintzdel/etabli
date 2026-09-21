import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { renderThemeCss } from '../src/tokens/theme-css'

writeFileSync(resolve(import.meta.dirname, '../src/tokens/theme.css'), renderThemeCss(), 'utf8')
