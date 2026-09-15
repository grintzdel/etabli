import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { parseAdminUsersQuery } from '@/modules/identity/core/model/admin-user'
import { IdentityFailureCode } from '@/modules/identity/core/model/session'
import { AdminUserFilters } from '@/modules/identity/react/components/AdminUserFilters'
import { AdminUserTable } from '@/modules/identity/react/components/AdminUserTable'
import { updateAdminUserAction } from '@/server/admin-users.actions'
import { adminUserPort } from '@/server/container'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Utilisateurs · Administration',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>

const Users = async ({ searchParams }: { readonly searchParams: SearchParams }) => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/admin/utilisateurs')

  const query = parseAdminUsersQuery(await searchParams)
  const result = await adminUserPort.list(token, query)
  if (!result.ok) {
    if (result.error.code === IdentityFailureCode.UNAUTHORIZED) redirect('/connexion?next=/admin/utilisateurs')
    return (
      <p role="alert" className="text-status-danger">
        {result.error.message}
      </p>
    )
  }

  return (
    <>
      <AdminUserFilters query={query} />
      <AdminUserTable users={result.value} action={updateAdminUserAction} />
    </>
  )
}

const UsersFallback = () => <Surface className="text-graphite-400">Chargement des comptes…</Surface>

export const AdminUsersPage = ({ searchParams }: { readonly searchParams: SearchParams }) => (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Utilisateurs</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Les comptes de la plateforme. Nommer un administrateur lui ouvre cette page ; suspendre un compte le déconnecte
        à sa prochaine requête et lui refuse la connexion. Vous ne pouvez faire ni l’un ni l’autre sur le vôtre.
      </p>
    </header>

    <Suspense fallback={<UsersFallback />}>
      <Users searchParams={searchParams} />
    </Suspense>
  </main>
)
