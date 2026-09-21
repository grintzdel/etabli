process.env['NODE_ENV'] = 'test'
process.env['DATABASE_URL'] ??= 'postgresql://pglite/in-memory'
process.env['JWT_SECRET'] ??= 'test-secret-not-a-secret-thirty-two-chars'
