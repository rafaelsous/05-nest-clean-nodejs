import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'node:child_process'
import { Redis } from 'ioredis'

import { DomainEvents } from '@/core/events/domain-events'
import { envSchema } from '@/infra/env/env'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

const env = envSchema.parse(process.env)

const prisma = new PrismaClient()
const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
})

function generateUniqueDatabaseURL(schema: string) {
  if (!env.DATABASE_URL) {
    throw new Error(
      'Please specify DATABASE_URL environment variable in .env file',
    )
  }

  const url = new URL(env.DATABASE_URL)
  url.searchParams.set('schema', schema)

  return url.toString()
}

const schema = randomUUID()

beforeAll(async () => {
  const databaseURL = generateUniqueDatabaseURL(schema)

  env.DATABASE_URL = databaseURL

  DomainEvents.shouldRun = false

  await redis.flushdb()

  execSync('npx prisma migrate deploy')

  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)

  await prisma.$disconnect()
})
