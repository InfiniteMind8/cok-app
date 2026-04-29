import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'CLERK_WEBHOOK_SECRET is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().min(1, 'RESEND_FROM_EMAIL is required'),
  RESEND_FROM_NAME: z.string().min(1, 'RESEND_FROM_NAME is required'),
  UPLOADTHING_TOKEN: z.string().min(1, 'UPLOADTHING_TOKEN is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
})

type EnvVars = z.infer<typeof envSchema>

function validateEnv(): EnvVars {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.message).join(', ')
    throw new Error(`Environment validation failed: ${missing}`)
  }
  return result.data
}

let _cached: EnvVars | undefined

// Lazy proxy: validates env vars on first access, not at module import time.
// This prevents Next.js build-time module analysis from failing when env vars are absent.
export const env = new Proxy({} as EnvVars, {
  get(_target, key: string) {
    if (!_cached) _cached = validateEnv()
    return _cached[key as keyof EnvVars]
  },
})
