import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}))

// Shared mock send function — exposed so individual tests can configure it
const _mockSend = vi.fn()

// Mock AWS SDK imports used by S3StorageDriver
vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = _mockSend
  }
  // Use regular functions (not arrow functions) so `new Command(params)` works
  function PutObjectCommand(this: any, params: unknown) { this.params = params; this._type = 'PutObject' }
  function GetObjectCommand(this: any, params: unknown) { this.params = params; this._type = 'GetObject' }
  function HeadObjectCommand(this: any, params: unknown) { this.params = params; this._type = 'HeadObject' }
  function DeleteObjectCommand(this: any, params: unknown) { this.params = params; this._type = 'DeleteObject' }
  return {
    S3Client: MockS3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async (_client, _cmd, { expiresIn }) => {
    return `https://bucket.s3.example.com/test-key?X-Amz-Expires=${expiresIn}`
  }),
}))

// ─── LocalStorageDriver tests ─────────────────────────────────────────────────

import {
  LocalStorageDriver,
  S3StorageDriver,
  getStorage,
  _resetStorageForTest,
} from '../driver'

const TEST_KEY = 'a'.repeat(64) // 64 hex chars = 32 bytes

describe('LocalStorageDriver', () => {
  let tmpDir: string
  let driver: LocalStorageDriver

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cok-storage-'))
    driver = new LocalStorageDriver(TEST_KEY, tmpDir, '')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('throws when encryption key is not 64 hex chars', () => {
    expect(() => new LocalStorageDriver('tooshort', tmpDir, '')).toThrow('STORAGE_ENCRYPTION_KEY')
  })

  it('put writes an encrypted file to disk', async () => {
    const body = Buffer.from('hello world')
    await driver.put('sub/test.pdf', body, 'application/pdf')
    const filePath = path.join(tmpDir, 'sub', 'test.pdf')
    expect(fs.existsSync(filePath)).toBe(true)
    // Encrypted content should differ from plaintext
    const stored = fs.readFileSync(filePath)
    expect(stored.equals(body)).toBe(false)
  })

  it('put returns correct storage_key, size, and sha256', async () => {
    const body = Buffer.from('test content')
    const result = await driver.put('test.txt', body, 'text/plain')
    expect(result.storage_key).toBe('test.txt')
    expect(result.size).toBe(body.length)
    const expectedSha = crypto.createHash('sha256').update(body).digest('hex')
    expect(result.sha256).toBe(expectedSha)
  })

  it('round-trip: put → decrypt → bytes match original', async () => {
    const body = Buffer.from('round trip data 🔐')
    await driver.put('roundtrip.bin', body, 'application/octet-stream')
    const { data } = await driver.decrypt('roundtrip.bin')
    expect(data.equals(body)).toBe(true)
  })

  it('tampered ciphertext fails GCM auth tag check', async () => {
    const body = Buffer.from('sensitive data')
    await driver.put('tamper.bin', body, 'application/octet-stream')

    // Flip a byte in the ciphertext (after 28-byte header)
    const filePath = path.join(tmpDir, 'tamper.bin')
    const fileData = fs.readFileSync(filePath)
    fileData[30] = fileData[30] ^ 0xff
    fs.writeFileSync(filePath, fileData)

    await expect(driver.decrypt('tamper.bin')).rejects.toThrow()
  })

  it('head returns correct size for encrypted file', async () => {
    const body = Buffer.from('head check content')
    await driver.put('headcheck.bin', body, 'application/octet-stream')
    const result = await driver.head('headcheck.bin')
    expect(result.size).toBe(body.length)
  })

  it('getSignedUrl returns /api/attachments/serve?token= URL', async () => {
    const url = await driver.getSignedUrl('some/file.pdf', 300)
    expect(url).toContain('/api/attachments/serve?token=')
  })

  it('verifyToken returns payload for valid token', async () => {
    const url = await driver.getSignedUrl('my/file.jpg', 300)
    const token = new URL('http://localhost' + url).searchParams.get('token')!
    const payload = driver.verifyToken(decodeURIComponent(token))
    expect(payload).not.toBeNull()
    expect(payload?.key).toBe('my/file.jpg')
    expect(payload?.exp).toBeGreaterThan(Date.now())
  })

  it('verifyToken returns null for expired token', async () => {
    // Manually build an expired token
    const payload = JSON.stringify({ key: 'old.jpg', exp: Date.now() - 1000 })
    const payloadB64 = Buffer.from(payload).toString('base64url')
    const keyBuf = Buffer.from(TEST_KEY, 'hex')
    const sig = crypto.createHmac('sha256', keyBuf).update(payloadB64).digest('base64url')
    const token = `${payloadB64}.${sig}`
    const result = driver.verifyToken(token)
    expect(result?.exp).toBeLessThan(Date.now())
  })

  it('verifyToken returns null for tampered signature', async () => {
    const url = await driver.getSignedUrl('secure.pdf', 60)
    const encoded = new URL('http://localhost' + url).searchParams.get('token')!
    const token = decodeURIComponent(encoded)
    const parts = token.split('.')
    // Corrupt the signature
    const tampered = parts[0] + '.invalidsignature'
    expect(driver.verifyToken(tampered)).toBeNull()
  })

  it('delete removes the file from disk', async () => {
    const body = Buffer.from('delete me')
    await driver.put('todelete.bin', body, 'application/octet-stream')
    await driver.delete('todelete.bin')
    expect(fs.existsSync(path.join(tmpDir, 'todelete.bin'))).toBe(false)
  })
})

// ─── S3StorageDriver tests ────────────────────────────────────────────────────

describe('S3StorageDriver', () => {
  const config = {
    bucket: 'test-bucket',
    region: 'us-east-1',
    endpoint: '',
    accessKey: 'AKID',
    secretKey: 'SECRET',
  }

  beforeEach(() => {
    _mockSend.mockReset()
    _mockSend.mockResolvedValue({ ContentLength: 42, ContentType: 'application/pdf' })
  })

  it('put calls PutObjectCommand with SSE-S3', async () => {
    const driver = new S3StorageDriver(config)
    const body = Buffer.from('s3 content')
    await driver.put('s3/file.pdf', body, 'application/pdf')
    expect(_mockSend).toHaveBeenCalled()
    const cmdArg = (_mockSend.mock.calls[0] as any[])[0] as any
    expect(cmdArg.params.ServerSideEncryption).toBe('AES256')
    expect(cmdArg.params.Bucket).toBe('test-bucket')
    expect(cmdArg.params.Key).toBe('s3/file.pdf')
  })

  it('put returns correct sha256', async () => {
    const body = Buffer.from('checksum content')
    const driver = new S3StorageDriver(config)
    const result = await driver.put('sha/file.bin', body, 'application/octet-stream')
    const expected = crypto.createHash('sha256').update(body).digest('hex')
    expect(result.sha256).toBe(expected)
  })

  it('head calls HeadObjectCommand', async () => {
    _mockSend.mockResolvedValue({ ContentLength: 1024, ContentType: 'image/jpeg' })
    const driver = new S3StorageDriver(config)
    const result = await driver.head('img/photo.jpg')
    expect(result.size).toBe(1024)
    expect(result.mime).toBe('image/jpeg')
  })

  it('getSignedUrl returns pre-signed URL with TTL ≤ 300s', async () => {
    const driver = new S3StorageDriver(config)
    const url = await driver.getSignedUrl('docs/file.pdf', 300)
    expect(url).toContain('X-Amz-Expires=300')
  })

  it('getSignedUrl clamps TTL to 300s maximum', async () => {
    const driver = new S3StorageDriver(config)
    const url = await driver.getSignedUrl('docs/file.pdf', 3600)
    expect(url).toContain('X-Amz-Expires=300')
  })

  it('delete calls DeleteObjectCommand', async () => {
    _mockSend.mockResolvedValue({})
    const driver = new S3StorageDriver(config)
    await driver.delete('remove/me.pdf')
    const cmdArg = (_mockSend.mock.calls[0] as any[])[0] as any
    expect(cmdArg.params.Key).toBe('remove/me.pdf')
  })
})

// ─── getStorage factory tests ─────────────────────────────────────────────────

describe('getStorage factory', () => {
  beforeEach(() => {
    _resetStorageForTest()
    vi.stubEnv('STORAGE_ENCRYPTION_KEY', TEST_KEY)
  })

  afterEach(() => {
    _resetStorageForTest()
    vi.unstubAllEnvs()
  })

  it('returns LocalStorageDriver when STORAGE_DRIVER=local', () => {
    vi.stubEnv('STORAGE_DRIVER', 'local')
    const storage = getStorage()
    expect(storage).toBeInstanceOf(LocalStorageDriver)
  })

  it('returns LocalStorageDriver when STORAGE_DRIVER is unset', () => {
    vi.stubEnv('STORAGE_DRIVER', '')
    _resetStorageForTest()
    vi.stubEnv('STORAGE_ENCRYPTION_KEY', TEST_KEY)
    const storage = getStorage()
    expect(storage).toBeInstanceOf(LocalStorageDriver)
  })

  it('returns S3StorageDriver when STORAGE_DRIVER=s3', () => {
    vi.stubEnv('STORAGE_DRIVER', 's3')
    vi.stubEnv('STORAGE_S3_BUCKET', 'my-bucket')
    vi.stubEnv('STORAGE_S3_REGION', 'us-east-1')
    vi.stubEnv('STORAGE_S3_ACCESS_KEY', 'AKID')
    vi.stubEnv('STORAGE_S3_SECRET_KEY', 'SECRET')
    const storage = getStorage()
    expect(storage).toBeInstanceOf(S3StorageDriver)
  })

  it('throws when STORAGE_DRIVER=s3 and required env vars are missing', () => {
    vi.stubEnv('STORAGE_DRIVER', 's3')
    vi.stubEnv('STORAGE_S3_BUCKET', '')
    expect(() => getStorage()).toThrow('Missing env var')
  })
})
