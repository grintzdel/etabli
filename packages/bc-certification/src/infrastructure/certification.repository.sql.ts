import * as SqlClient from '@effect/sql/SqlClient'
import { RepoError } from '@etabli/shared/errors'
import type { CertificationId, MachineId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { CertificationStatus } from '../domain/certification.constants'
import type { Certification } from '../domain/certification.schema'
import { CertificationRepository } from './certification.repository'

interface CertificationRow {
  readonly id: string
  readonly user_id: string
  readonly machine_id: string
  readonly status: string
  readonly requested_at: Date
  readonly decided_at: Date | null
  readonly decided_by: string | null
}

const toCertification = (row: CertificationRow): Certification => ({
  id: row.id as Certification['id'],
  userId: row.user_id as Certification['userId'],
  machineId: row.machine_id as Certification['machineId'],
  status: row.status as Certification['status'],
  requestedAt: DateTime.unsafeFromDate(row.requested_at),
  decidedAt: row.decided_at === null ? null : DateTime.unsafeFromDate(row.decided_at),
  decidedBy: row.decided_by === null ? null : (row.decided_by as Certification['userId']),
})

const fail = (operation: string) => (cause: unknown) => new RepoError({ cause, operation })

export const makeCertificationRepositorySql = (sql: SqlClient.SqlClient) =>
  CertificationRepository.of({
    findById: (id: CertificationId) =>
      sql<CertificationRow>`SELECT * FROM certifications WHERE id = ${id} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toCertification(rows[0]))),
        Effect.mapError(fail('certifications.findById'))
      ),

    findForUserAndMachine: (userId: UserId, machineId: MachineId) =>
      sql<CertificationRow>`
        SELECT * FROM certifications WHERE user_id = ${userId} AND machine_id = ${machineId} LIMIT 1
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toCertification(rows[0]))),
        Effect.mapError(fail('certifications.findForUserAndMachine'))
      ),

    listForUser: (userId: UserId) =>
      sql<CertificationRow>`
        SELECT * FROM certifications WHERE user_id = ${userId} ORDER BY requested_at DESC
      `.pipe(
        Effect.map((rows) => rows.map(toCertification)),
        Effect.mapError(fail('certifications.listForUser'))
      ),

    listForMachines: (machineIds: ReadonlyArray<MachineId>) =>
      machineIds.length === 0
        ? Effect.succeed([])
        : sql<CertificationRow>`
            SELECT * FROM certifications
            WHERE machine_id IN ${sql.in(machineIds)}
            ORDER BY requested_at ASC
          `.pipe(
            Effect.map((rows) => rows.map(toCertification)),
            Effect.mapError(fail('certifications.listForMachines'))
          ),

    insert: (certification) =>
      sql<CertificationRow>`
        INSERT INTO certifications (id, user_id, machine_id, status, requested_at, decided_at, decided_by)
        VALUES (
          ${certification.id}, ${certification.userId}, ${certification.machineId}, ${certification.status},
          ${DateTime.toDate(certification.requestedAt)},
          ${certification.decidedAt === null ? null : DateTime.toDate(certification.decidedAt)},
          ${certification.decidedBy}
        )
        RETURNING *
      `.pipe(
        Effect.flatMap((rows) =>
          rows[0] === undefined
            ? Effect.fail(new RepoError({ cause: 'no row returned', operation: 'certifications.insert' }))
            : Effect.succeed(toCertification(rows[0]))
        ),
        Effect.mapError(fail('certifications.insert'))
      ),

    reopen: (id: CertificationId, at) =>
      sql<CertificationRow>`
        UPDATE certifications
        SET status = 'PENDING', decided_by = NULL, decided_at = NULL, requested_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toCertification(rows[0]))),
        Effect.mapError(fail('certifications.reopen'))
      ),

    decide: (id: CertificationId, status: CertificationStatus, decidedBy: UserId, at) =>
      sql<CertificationRow>`
        UPDATE certifications
        SET status = ${status}, decided_by = ${decidedBy}, decided_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toCertification(rows[0]))),
        Effect.mapError(fail('certifications.decide'))
      ),
  })

export const CertificationRepositorySqlLayer = Layer.effect(
  CertificationRepository,
  Effect.map(SqlClient.SqlClient, makeCertificationRepositorySql)
)
