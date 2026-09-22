import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const ALIAS = '@/'

const IMPORT = new RegExp(
  String.raw`(?:^|[\s;(=])(import|export|require)\s*(type\s+)?([\s\S]*?)?['"]([^'"]+)['"]`,
  'gm'
)

export const stripComments = (source: string): string =>
  source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/(^|[^:])\/\/[^\n]*/g, '$1')

// `git ls-files` still lists a file deleted in the working tree, so the graph would read a hole.
export const listSourceFiles = (cwd: string): ReadonlyArray<string> =>
  execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter((file) => existsSync(join(cwd, file)))

const candidatesFor = (base: string): ReadonlyArray<string> => [
  `${base}.ts`,
  `${base}.tsx`,
  join(base, 'index.ts'),
  join(base, 'index.tsx'),
  base,
]

export const resolveSpecifier = (specifier: string, importer: string, known: ReadonlySet<string>): string | null => {
  let base: string
  if (specifier.startsWith(ALIAS)) base = join('src', specifier.slice(ALIAS.length))
  else if (specifier.startsWith('.')) base = normalize(join(dirname(importer), specifier))
  else return null

  return candidatesFor(base).find((candidate) => known.has(candidate)) ?? null
}

export const isProduction = (path: string): boolean =>
  !/\.test\.(e2e\.)?tsx?$/.test(path) && !path.startsWith('src/e2e/') && !path.endsWith('.d.ts')

const typeExportsOf = (source: string): ReadonlySet<string> =>
  new Set([...source.matchAll(/export\s+(?:type|interface)\s+([A-Za-z0-9_$]+)/g)].map(([, name]) => name ?? ''))

const bindingsOf = (clause: string): { names: ReadonlyArray<string>; allInlineType: boolean } => {
  const braced = /\{([\s\S]*)\}/.exec(clause)
  if (!braced) {
    const plain = /([A-Za-z0-9_$]+)/.exec(clause.replaceAll(/\bfrom\b/g, ''))
    return { names: plain?.[1] === undefined ? [] : [plain[1]], allInlineType: false }
  }

  const parts = (braced[1] ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    names: parts
      .map(
        (part) =>
          part
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0]
            ?.trim() ?? ''
      )
      .filter(Boolean),
    allInlineType: parts.length > 0 && parts.every((part) => /^type\s/.test(part)),
  }
}

export interface ImportGraph {
  readonly files: ReadonlyArray<string>
  readonly edges: ReadonlyMap<string, ReadonlySet<string>>
  readonly edgeCount: number
  readonly typeOnlyEdgeCount: number
}

export const buildImportGraph = (cwd: string): ImportGraph => {
  const tracked = listSourceFiles(cwd)
  const known = new Set(tracked)
  const files = tracked.filter(isProduction)

  const cache = new Map<string, string>()
  const readSource = (path: string): string => {
    const cached = cache.get(path)
    if (cached !== undefined) return cached
    const full = join(cwd, path)
    const text = existsSync(full) ? readFileSync(full, 'utf8') : ''
    cache.set(path, text)
    return text
  }

  const edges = new Map<string, Set<string>>()
  let edgeCount = 0
  let typeOnlyEdgeCount = 0

  for (const file of files) {
    const source = stripComments(readSource(file))
    const targets = new Set<string>()

    for (const [, keyword, typeKeyword, clause, specifier] of source.matchAll(IMPORT)) {
      const target = resolveSpecifier(specifier ?? '', file, known)
      if (target === null || target === file || !isProduction(target)) continue

      if (typeKeyword !== undefined) {
        typeOnlyEdgeCount += 1
        continue
      }

      const { names, allInlineType } = bindingsOf(clause ?? '')
      if (allInlineType) {
        typeOnlyEdgeCount += 1
        continue
      }

      if (keyword !== 'require' && names.length > 0) {
        const typeExports = typeExportsOf(stripComments(readSource(target)))
        if (names.every((name) => typeExports.has(name))) {
          typeOnlyEdgeCount += 1
          continue
        }
      }

      targets.add(target)
    }

    edgeCount += targets.size
    edges.set(file, targets)
  }

  return { files, edges, edgeCount, typeOnlyEdgeCount }
}

export const bareSpecifiersOf = (cwd: string, file: string): ReadonlyArray<string> => {
  const source = stripComments(readFileSync(join(cwd, file), 'utf8'))
  return [...source.matchAll(IMPORT)]
    .map(([, , , , specifier]) => specifier ?? '')
    .filter((specifier) => !specifier.startsWith('.') && !specifier.startsWith(ALIAS))
}

export const findCycles = ({ files, edges }: ImportGraph): ReadonlyArray<ReadonlyArray<string>> => {
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: Array<string> = []
  const cycles: Array<Array<string>> = []
  let counter = 0

  for (const root of files) {
    if (index.has(root)) continue
    const work: Array<{ node: string; next: number; succs: Array<string> }> = [
      { node: root, next: 0, succs: [...(edges.get(root) ?? [])].toSorted() },
    ]
    index.set(root, counter)
    low.set(root, counter)
    counter += 1
    stack.push(root)
    onStack.add(root)

    while (work.length > 0) {
      const frame = work.at(-1)
      if (frame === undefined) break

      if (frame.next < frame.succs.length) {
        const child = frame.succs[frame.next] ?? ''
        frame.next += 1
        if (!index.has(child)) {
          index.set(child, counter)
          low.set(child, counter)
          counter += 1
          stack.push(child)
          onStack.add(child)
          work.push({ node: child, next: 0, succs: [...(edges.get(child) ?? [])].toSorted() })
        } else if (onStack.has(child)) {
          low.set(frame.node, Math.min(low.get(frame.node) ?? 0, index.get(child) ?? 0))
        }
        continue
      }

      work.pop()
      if (low.get(frame.node) === index.get(frame.node)) {
        const component: Array<string> = []
        for (;;) {
          const popped = stack.pop()
          if (popped === undefined) break
          onStack.delete(popped)
          component.push(popped)
          if (popped === frame.node) break
        }
        if (component.length > 1) cycles.push(component.toSorted())
      }

      const parent = work.at(-1)
      if (parent !== undefined) {
        low.set(parent.node, Math.min(low.get(parent.node) ?? 0, low.get(frame.node) ?? 0))
      }
    }
  }

  return cycles
}
