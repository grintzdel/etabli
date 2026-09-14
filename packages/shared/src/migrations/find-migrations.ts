import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_SUBPATH = 'src/infrastructure/migrations'
const FILENAME = /^(\d{4})_([^.]+)\.sql$/

export interface MigrationFile {
  readonly id: number
  readonly name: string
  readonly filename: string
  readonly path: string
}

const findWorkspaceRoot = (start: string): string => {
  let dir = start
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`Cannot find workspace root from ${start} (no pnpm-workspace.yaml)`)
    dir = parent
  }
}

const ownsMigrations = (pkg: string): boolean => pkg === 'shared' || pkg.startsWith('bc-')

export const findMigrations = (startPath?: string): ReadonlyArray<MigrationFile> => {
  const start = startPath ?? dirname(fileURLToPath(import.meta.url))
  const packagesDir = join(findWorkspaceRoot(start), 'packages')
  const files: Array<MigrationFile> = []
  const seen = new Map<number, string>()

  for (const pkg of readdirSync(packagesDir).toSorted()) {
    if (!ownsMigrations(pkg)) continue
    const dir = join(packagesDir, pkg, MIGRATIONS_SUBPATH)
    if (!existsSync(dir)) continue

    for (const filename of readdirSync(dir).toSorted()) {
      const match = FILENAME.exec(filename)
      if (!match) continue
      const id = Number(match[1])
      const source = `${pkg}/${filename}`
      const previous = seen.get(id)
      if (previous !== undefined) throw new Error(`Duplicate migration prefix ${match[1]}: ${previous} and ${source}`)
      seen.set(id, source)
      files.push({ id, name: match[2] ?? '', filename, path: join(dir, filename) })
    }
  }

  return files.toSorted((a, b) => a.id - b.id)
}
