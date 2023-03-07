import path from 'path'
import fs from 'fs/promises'
import mssql from 'mssql'

require('dotenv').config()

const DSN = (process.env.ECUM_REPORT_STUDENT_DATABASE_URL || '').trim()

const config = {
  user: (DSN.match(/user=([^;]+);/) || [])[1],
  password: (DSN.match(/password=([^;]+);/) || [])[1],
  server: (DSN.match(/:\/\/([^;]+);/) || [])[1],
  database: (DSN.match(/database=([^;]+);/) || [])[1],
  options: {
    encrypt: false
  }
}

const QUERIES_PATH = path.join(__dirname, '..', 'queries.sql')

async function main() {
  const queries_sql = await fs.readFile(QUERIES_PATH, { encoding: 'utf8' });
  const queries = queries_sql
    .split(/\nGO\n/)
    .map(s => s.trim())
    .filter(Boolean)

  const pool = await mssql.connect(config)

  const transaction = new mssql.Transaction(pool)
  await transaction.begin()
  const request = transaction.request()
  for (const sql of queries) {
    try {
      const result = await request.batch(sql)
    } catch (error) {
      console.error({sql, error})
    }
  }
  await transaction.commit()
}

;(async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
