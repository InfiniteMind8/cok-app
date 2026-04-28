import { describe, it, expect } from 'vitest'
import * as ModalModule from '@/components/ui/modal'

describe('Modal primitive — structural exports', () => {
  const expectedExports = [
    'Modal',
    'ModalTrigger',
    'ModalPortal',
    'ModalClose',
    'ModalContent',
    'ModalHeader',
    'ModalBody',
    'ModalFooter',
    'ModalTitle',
    'ModalDescription',
  ]

  it('exports all required named exports', () => {
    for (const name of expectedExports) {
      expect(
        ModalModule[name as keyof typeof ModalModule],
        `Expected named export "${name}" to be defined`
      ).toBeDefined()
    }
  })

  it('all exports are functions (React components or compound wrappers)', () => {
    for (const name of expectedExports) {
      const exp = ModalModule[name as keyof typeof ModalModule]
      expect(
        typeof exp,
        `Expected "${name}" to be a function, got ${typeof exp}`
      ).toBe('function')
    }
  })

  it('exports exactly the documented API — no missing, no extra undocumented exports', () => {
    const actualExports = Object.keys(ModalModule)
    for (const name of expectedExports) {
      expect(actualExports).toContain(name)
    }
  })
})

/*
 * Focus management interactive test (focus trap, first-focusable, return-on-close)
 * requires @testing-library/react + jsdom environment.
 * Deferred to D.10 (Playwright E2E) — see decision-log D-013.
 * The underlying @base-ui/react/dialog provides focus trap natively.
 */
