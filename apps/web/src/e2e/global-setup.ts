import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const workspaceRoot = fileURLToPath(new URL('../../../..', import.meta.url))

const globalSetup = () => {
  if (process.env.E2E_SKIP_SEED === '1') return

  execFileSync('pnpm', ['run', 'db:migrate:test:api'], { cwd: workspaceRoot, stdio: 'inherit' })
  execFileSync('pnpm', ['run', 'db:seed:test:api'], { cwd: workspaceRoot, stdio: 'inherit' })
}

export default globalSetup
