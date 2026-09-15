import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { adminUserFixture } from '@/modules/identity/__tests__/identity.factory'
import { ADMIN_USERS_LIMIT } from '@/modules/identity/core/model/admin-user'
import { idleSettings } from '@/modules/identity/core/model/settings'

import { AdminUserTable } from './AdminUserTable'

const action = vi.fn().mockResolvedValue(idleSettings)

describe('AdminUserTable', () => {
  it('says so when no account answers the filters', () => {
    render(<AdminUserTable users={[]} action={action} membershipAction={action} />)

    expect(screen.getByText(/aucun compte ne répond à ces filtres/i)).toBeVisible()
  })

  it('names the account and its address', () => {
    render(
      <AdminUserTable
        users={[adminUserFixture({ displayName: 'Inès Ferrand' })]}
        action={action}
        membershipAction={action}
      />
    )

    const row = screen.getByRole('row', { name: /inès ferrand/i })
    expect(row).toHaveTextContent('Membre')
    expect(row).toHaveTextContent('Actif')
  })

  it('offers to name a plain member administrator', () => {
    render(<AdminUserTable users={[adminUserFixture()]} action={action} membershipAction={action} />)

    expect(screen.getByRole('button', { name: /nommer administrateur/i })).toBeVisible()
    expect(screen.queryByRole('button', { name: /retirer l’administration/i })).toBeNull()
  })

  it('offers to take the administration back from an admin', () => {
    render(
      <AdminUserTable
        users={[adminUserFixture({ platformRole: 'PLATFORM_ADMIN' })]}
        action={action}
        membershipAction={action}
      />
    )

    expect(screen.getByRole('button', { name: /retirer l’administration/i })).toBeVisible()
  })

  it('offers to reactivate a suspended account rather than to suspend it again', () => {
    render(
      <AdminUserTable users={[adminUserFixture({ status: 'SUSPENDED' })]} action={action} membershipAction={action} />
    )

    expect(screen.getByRole('button', { name: /^réactiver$/i })).toBeVisible()
    expect(screen.queryByRole('button', { name: /^suspendre$/i })).toBeNull()
  })

  it('says when an account joined no atelier', () => {
    render(<AdminUserTable users={[adminUserFixture({ ateliers: [] })]} action={action} membershipAction={action} />)

    expect(screen.getByText(/aucun/i)).toBeVisible()
  })

  it('offers to name a member fabmanager of the atelier it joined', () => {
    const user = adminUserFixture({
      ateliers: [{ id: 'a-1', slug: 'la-forge', name: 'La Forge', role: 'MEMBER' }],
    })

    render(<AdminUserTable users={[user]} action={action} membershipAction={action} />)

    expect(screen.getByText(/la forge · membre/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /nommer fabmanager de la forge/i })).toBeVisible()
  })

  it('offers to take the gestion back from a fabmanager', () => {
    const user = adminUserFixture({
      ateliers: [{ id: 'a-1', slug: 'la-forge', name: 'La Forge', role: 'FABMANAGER' }],
    })

    render(<AdminUserTable users={[user]} action={action} membershipAction={action} />)

    expect(screen.getByText(/la forge · fabmanager/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /retirer la gestion de la forge/i })).toBeVisible()
  })

  it('says out loud that the list is capped', () => {
    const users = Array.from({ length: ADMIN_USERS_LIMIT }, () => adminUserFixture())

    render(<AdminUserTable users={users} action={action} membershipAction={action} />)

    expect(screen.getByText(new RegExp(`les ${ADMIN_USERS_LIMIT} comptes les plus récents`, 'i'))).toBeVisible()
  })

  it('stays quiet about the cap when the list is short', () => {
    render(<AdminUserTable users={[adminUserFixture()]} action={action} membershipAction={action} />)

    expect(screen.queryByText(/les plus récents/i)).toBeNull()
  })
})
