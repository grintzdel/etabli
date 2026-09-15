import { describe, expect, it } from 'vitest'

import { parseAdminUsersQuery } from './admin-user'

describe('parseAdminUsersQuery', () => {
  it('keeps a search, a role and a status', () => {
    expect(parseAdminUsersQuery({ search: ' camille ', platformRole: 'PLATFORM_ADMIN', status: 'SUSPENDED' })).toEqual({
      search: 'camille',
      platformRole: 'PLATFORM_ADMIN',
      status: 'SUSPENDED',
    })
  })

  it('drops a role and a status nobody holds', () => {
    expect(parseAdminUsersQuery({ platformRole: 'ROOT', status: 'GONE' })).toEqual({})
  })

  it('drops a search that holds nothing but spaces', () => {
    expect(parseAdminUsersQuery({ search: '   ' })).toEqual({})
  })

  it('reads the first of a repeated parameter', () => {
    expect(parseAdminUsersQuery({ status: ['ACTIVE', 'SUSPENDED'] })).toEqual({ status: 'ACTIVE' })
  })
})
