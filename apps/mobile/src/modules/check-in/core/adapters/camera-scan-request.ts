type Resolve = (token: string | null) => void

let listener: ((resolve: Resolve) => void) | null = null

export const onCameraScanRequest = (handler: (resolve: Resolve) => void): (() => void) => {
  listener = handler
  return () => {
    if (listener === handler) listener = null
  }
}

export const requestCameraScan = (): Promise<string | null> =>
  new Promise<string | null>((resolve) => {
    if (listener === null) resolve(null)
    else listener(resolve)
  })
