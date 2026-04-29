import { describe, it, expect } from 'vitest'
import { getTourSteps } from '../steps'
import type { Role } from '@prisma/client'

const ALL_ROLES: Role[] = ['MASTER_ADMIN', 'ADMIN', 'RESIDENT', 'VENDOR', 'VISITOR']

describe('getTourSteps', () => {
  it('returns 8 steps for MASTER_ADMIN', () => {
    expect(getTourSteps('MASTER_ADMIN')).toHaveLength(8)
  })

  it('returns 5 steps for ADMIN', () => {
    expect(getTourSteps('ADMIN')).toHaveLength(5)
  })

  it('returns 5 steps for RESIDENT', () => {
    expect(getTourSteps('RESIDENT')).toHaveLength(5)
  })

  it('returns 4 steps for VENDOR', () => {
    expect(getTourSteps('VENDOR')).toHaveLength(4)
  })

  it('returns 4 steps for VISITOR', () => {
    expect(getTourSteps('VISITOR')).toHaveLength(4)
  })

  it.each(ALL_ROLES)('every step for %s has required fields', (role) => {
    const steps = getTourSteps(role)
    for (const step of steps) {
      expect(step.id).toBeTruthy()
      expect(step.target).toBeTruthy()
      expect(step.title).toBeTruthy()
      expect(step.body).toBeTruthy()
    }
  })

  it.each(ALL_ROLES)('no duplicate step IDs within %s tour', (role) => {
    const steps = getTourSteps(role)
    const ids = steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns empty array for unknown role', () => {
    // @ts-expect-error — intentional unknown role
    expect(getTourSteps('UNKNOWN_ROLE')).toEqual([])
  })

  it('step titles contain no exclamation marks', () => {
    for (const role of ALL_ROLES) {
      for (const step of getTourSteps(role)) {
        expect(step.title).not.toContain('!')
        expect(step.body).not.toContain('!')
      }
    }
  })
})
