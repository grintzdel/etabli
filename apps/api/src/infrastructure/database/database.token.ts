import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'

import type * as schema from './schema/index.ts'

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION')

export type Schema = typeof schema

export type Database = NodePgDatabase<Schema>

export type Transaction = PgTransaction<NodePgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>

export type Transactable = Database | Transaction
