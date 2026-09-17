import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import type { IdentityResult, LoginInput, Session } from '../../core/model/session'
import { SessionContext, type SessionState } from '../hooks/use-session'

export const SessionProvider = ({ children }: { readonly children: ReactNode }) => {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      const token = await dependencies.sessionStore.read()
      if (token === null) {
        if (!cancelled) setState({ status: 'anonymous' })
        return
      }

      const me = await dependencies.identity.me(token)
      if (cancelled) return
      if (me.ok) setState({ status: 'authenticated', token, user: me.value })
      else {
        await dependencies.sessionStore.clear()
        setState({ status: 'anonymous' })
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(
    async (input: LoginInput): Promise<IdentityResult<Session>> => {
      const result = await dependencies.identity.login(input)
      if (!result.ok) return result

      await dependencies.sessionStore.write(result.value.token)
      queryClient.clear()
      setState({ status: 'authenticated', token: result.value.token, user: result.value.user })
      return result
    },
    [queryClient]
  )

  const signOut = useCallback(() => {
    void dependencies.sessionStore.clear()
    queryClient.clear()
    setState({ status: 'anonymous' })
  }, [queryClient])

  return (
    <SessionContext
      value={{
        state,
        token: state.status === 'authenticated' ? state.token : null,
        user: state.status === 'authenticated' ? state.user : null,
        signIn,
        signOut,
      }}
    >
      {children}
    </SessionContext>
  )
}
