import { and, eq, type SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'

import type { Database, Transactable } from '../../infrastructure/database/database.token.ts'

type IdColumn = PgTable['_']['columns'][string]

export abstract class BaseRepository<Row extends Record<string, unknown>> {
  protected constructor(
    protected readonly db: Database,
    private readonly table: PgTable,
    private readonly idColumn: IdColumn
  ) {}

  protected conn(tx?: Transactable): Transactable {
    return tx ?? this.db
  }

  protected async selectOne(where: SQL | undefined, tx?: Transactable): Promise<Row | null> {
    const rows = await this.conn(tx).select().from(this.table).where(where).limit(1)
    return (rows[0] as Row | undefined) ?? null
  }

  protected async findRowById(id: string, tx?: Transactable): Promise<Row | null> {
    return this.selectOne(eq(this.idColumn, id), tx)
  }

  protected async deleteById(id: string, tx?: Transactable): Promise<void> {
    await this.conn(tx).delete(this.table).where(eq(this.idColumn, id))
  }

  protected static every(...clauses: ReadonlyArray<SQL | undefined>): SQL | undefined {
    const kept = clauses.filter((clause): clause is SQL => clause !== undefined)
    return kept.length === 0 ? undefined : and(...kept)
  }
}
