export const stub = <T extends object>(partial: Partial<T>): T =>
  new Proxy(partial, {
    get: (target, prop) =>
      prop in target
        ? Reflect.get(target, prop)
        : () => {
            throw new Error(`Unstubbed ${String(prop)}`)
          },
  }) as T
