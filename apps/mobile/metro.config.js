const path = require('node:path')

const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.unstable_enablePackageExports = true

// pnpm gives every workspace package its own node_modules, so a shared package would otherwise
// pull a second copy of React into the bundle and every hook would throw.
const singletons = ['react', 'react-dom', 'react-native', 'react-native-web']
const appOrigin = path.join(projectRoot, 'package.json')

config.resolver.resolveRequest = (context, moduleName, platform) =>
  singletons.some((name) => moduleName === name || moduleName.startsWith(`${name}/`))
    ? context.resolveRequest({ ...context, originModulePath: appOrigin }, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)

module.exports = config
