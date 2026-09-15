import request from 'supertest'

import { SEED_PASSWORD } from '../../infrastructure/database/seed.data.ts'
import { seed } from '../../infrastructure/database/seed.ts'
import { DEFAULT_TEST_NOW, makeTestApp, type TestApp } from './app.harness.ts'

export const SEED = {
  admin: 'admin@etabli.test',
  forgeFabmanager: 'fabmanager.forge@etabli.test',
  lyonFabmanager: 'fabmanager.lyon@etabli.test',
  copeauxFabmanager: 'fabmanager.copeaux@etabli.test',
  member: 'membre@etabli.test',
  newcomer: 'nouveau@etabli.test',
  suspended: 'suspendu@etabli.test',
  password: SEED_PASSWORD,
  atelier: {
    forge: '0a7e1f00-0000-4000-8000-000000000001',
    lyon: '0a7e1f00-0000-4000-8000-000000000002',
    draft: '0a7e1f00-0000-4000-8000-000000000003',
    copeaux: '0a7e1f00-0000-4000-8000-000000000004',
  },
  machine: {
    forgeLaser: '0a7e1f00-0000-4000-8000-000000000101',
    forgePrusa: '0a7e1f00-0000-4000-8000-000000000102',
    forgeRetired: '0a7e1f00-0000-4000-8000-000000000105',
    copeauxBambu: '0a7e1f00-0000-4000-8000-000000000402',
    lyonJuki: '0a7e1f00-0000-4000-8000-000000000201',
  },
  user: {
    admin: '0a7e2000-0000-4000-8000-000000000001',
    forgeFabmanager: '0a7e2000-0000-4000-8000-000000000002',
    copeauxFabmanager: '0a7e2000-0000-4000-8000-000000000007',
    member: '0a7e2000-0000-4000-8000-000000000004',
    newcomer: '0a7e2000-0000-4000-8000-000000000005',
  },
} as const

export interface SeededApp extends TestApp {
  signIn(email: string): Promise<string>
}

export const makeSeededApp = async (now: string = DEFAULT_TEST_NOW): Promise<SeededApp> => {
  const harness = await makeTestApp(now)
  await seed(harness.db, new Date(now))

  return {
    ...harness,
    signIn: async (email: string): Promise<string> => {
      const response = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: SEED_PASSWORD })

      if (response.status !== 200) {
        throw new Error(`sign-in failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`)
      }
      return (response.body as { readonly token: string }).token
    },
  }
}

export const bearer = (token: string): string => `Bearer ${token}`
