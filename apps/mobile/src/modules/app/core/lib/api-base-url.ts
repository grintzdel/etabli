const API_PORT = 3001
const LOCALHOST = `http://localhost:${API_PORT}`

const isLanHost = (host: string): boolean => /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.endsWith('.local')

export const apiBaseUrlFrom = (explicitUrl: string | undefined, devServerHostUri: string | undefined): string => {
  if (explicitUrl !== undefined && explicitUrl.trim() !== '') return explicitUrl.trim()
  if (devServerHostUri === undefined) return LOCALHOST

  const host = devServerHostUri.split(':')[0] ?? ''
  return isLanHost(host) ? `http://${host}:${API_PORT}` : LOCALHOST
}
