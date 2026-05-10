// Read-only DB connectivity test. No mutations.
// Run: node --env-file=.env .tmp/db-connection-test.cjs
const { Client } = require('pg')

async function test(label, connectionString) {
  if (!connectionString) {
    console.log(`[${label}] not set in .env`)
    return
  }
  const client = new Client({ connectionString })
  const startedAt = Date.now()
  try {
    await client.connect()
    const ms = Date.now() - startedAt
    const meta = await client.query(`
      SELECT
        current_database()                                                 AS db,
        current_user                                                       AS "user",
        regexp_replace(version(), '^(PostgreSQL [0-9.]+).*', '\\1')         AS pg_version,
        (SELECT COUNT(*)::int FROM information_schema.tables
           WHERE table_schema='public')                                    AS table_count
    `)
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' ORDER BY table_name LIMIT 12
    `)
    let counts = {}
    for (const tbl of ['User', 'Wallet', 'Account', 'Property', 'Transaction', 'CommunityUpdate', 'AuditLog']) {
      try {
        const r = await client.query(`SELECT COUNT(*)::int AS n FROM "${tbl}"`)
        counts[tbl] = r.rows[0].n
      } catch (e) {
        counts[tbl] = `(${e.code || 'err'})`
      }
    }
    console.log(`[${label}] CONNECTED in ${ms} ms`)
    console.log(`[${label}]   meta:    `, meta.rows[0])
    console.log(`[${label}]   tables (first 12):`, tables.rows.map((r) => r.table_name).join(', '))
    console.log(`[${label}]   row counts:`, counts)
  } catch (e) {
    console.error(`[${label}] FAILED:`, (e.message || String(e)).slice(0, 400))
    if (e.code) console.error(`[${label}]   code:`, e.code)
  } finally {
    await client.end().catch(() => {})
  }
}

;(async () => {
  await test('DATABASE_URL', process.env.DATABASE_URL)
  console.log('')
  await test('DIRECT_URL  ', process.env.DIRECT_URL)
})()
