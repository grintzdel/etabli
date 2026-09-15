import { SqlClient } from '@effect/sql'
import { MachineId } from '@etabli/shared/schema'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { MachineStatus } from '../domain/atelier.constants'
import { makeAtelierRepositorySql } from './atelier.repository.sql'

const runtime = ManagedRuntime.make(PgLiteSqlClientLayer({ withAllMigrations: true }))
const sql = await runtime.runPromise(SqlClient.SqlClient)
const repository = makeAtelierRepositorySql(sql)

const FORGE = '10000000-0000-4000-8000-000000000001'
const TROTEC = MachineId.make('20000000-0000-4000-8000-000000000001')
const PRUSA = MachineId.make('20000000-0000-4000-8000-000000000002')

const at = DateTime.unsafeFromDate(new Date('2026-03-02T09:00:00Z'))

await runtime.runPromise(sql`
  INSERT INTO ateliers (id, slug, name, city, latitude, longitude, status)
  VALUES (${FORGE}, 'la-forge', 'La Forge', 'Montreuil', 48.8638, 2.4485, 'PUBLISHED')
`)

afterAll(() => runtime.dispose())

beforeEach(() =>
  runtime.runPromise(
    Effect.gen(function* () {
      yield* sql`DELETE FROM machines`
      yield* sql`
        INSERT INTO machines (id, atelier_id, name, kind, nfc_tag_id)
        VALUES (${TROTEC}, ${FORGE}, 'Trotec', 'LASER_CUTTER', 'tag-trotec'),
               (${PRUSA}, ${FORGE}, 'Prusa', 'PRINTER_3D', null)
      `
    })
  )
)

const tagOf = (id: MachineId) => runtime.runPromise(repository.findMachineById(id)).then((m) => m?.nfcTagId)

describe('AtelierRepository on Postgres', () => {
  it('sticks a tag on a machine that had none', async () => {
    await runtime.runPromise(repository.updateMachine(PRUSA, { nfcTagId: 'tag-prusa' }, at))

    await expect(tagOf(PRUSA)).resolves.toBe('tag-prusa')
  })

  it('peels the tag off when the patch carries null', async () => {
    await runtime.runPromise(repository.updateMachine(TROTEC, { nfcTagId: null }, at))

    await expect(tagOf(TROTEC)).resolves.toBeNull()
  })

  it('leaves the tag alone when the patch does not mention it', async () => {
    await runtime.runPromise(repository.updateMachine(TROTEC, { status: MachineStatus.MAINTENANCE }, at))

    await expect(tagOf(TROTEC)).resolves.toBe('tag-trotec')
  })

  it('finds the machine wearing a tag, and nothing for an unknown one', async () => {
    const wearer = await runtime.runPromise(repository.findMachineByNfcTag('tag-trotec'))
    const nobody = await runtime.runPromise(repository.findMachineByNfcTag('tag-unknown'))

    expect(wearer?.id).toBe(TROTEC)
    expect(nobody).toBeNull()
  })

  it('keeps the tag unique across the parc', async () => {
    const exit = await runtime.runPromiseExit(repository.updateMachine(PRUSA, { nfcTagId: 'tag-trotec' }, at))

    expect(exit._tag).toBe('Failure')
  })
})
