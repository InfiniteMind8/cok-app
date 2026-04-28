'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'

export function ModalPreviewClient() {
  const [standard, setStandard] = useState(false)
  const [wide, setWide] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [noBackdrop, setNoBackdrop] = useState(false)

  return (
    <div className="min-h-screen bg-karis-stone-50 p-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-karis-green-900 mb-1">Modal primitive — dev preview</h1>
        <p className="font-body text-sm text-karis-stone-500">
          Isolated render of all Modal variants. §4.4 spacing enforced. Only visible when NEXT_PUBLIC_DEMO_MODE=true.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* 1 — Standard */}
        <Button onClick={() => setStandard(true)} className="font-body text-sm">Standard modal</Button>
        <Modal open={standard} onOpenChange={setStandard}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle className="font-heading text-karis-green-900">Confirm action</ModalTitle>
              <ModalDescription className="font-body text-sm text-karis-stone-500">
                This is a standard confirmation modal. 24/32 px inner padding. Max-width 560 px.
                Close button top-right. Esc closes. Backdrop click closes.
              </ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <Button variant="outline" size="sm" onClick={() => setStandard(false)}>Cancel</Button>
              <Button size="sm" onClick={() => setStandard(false)}>Confirm</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 2 — Wide (size="lg") */}
        <Button onClick={() => setWide(true)} variant="outline" className="font-body text-sm">Wide modal (size=&quot;lg&quot;)</Button>
        <Modal open={wide} onOpenChange={setWide}>
          <ModalContent size="lg">
            <ModalHeader>
              <ModalTitle className="font-heading text-karis-green-900">Two-column form</ModalTitle>
              <ModalDescription className="font-body text-sm text-karis-stone-500">
                Wide modal — max-width 720 px. Suitable for two-column form layouts.
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-karis-stone-100 animate-pulse" />
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" size="sm" onClick={() => setWide(false)}>Cancel</Button>
              <Button size="sm" onClick={() => setWide(false)}>Save</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 3 — Scrolling body */}
        <Button onClick={() => setScrolling(true)} variant="outline" className="font-body text-sm">Scrolling body</Button>
        <Modal open={scrolling} onOpenChange={setScrolling}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle className="font-heading text-karis-green-900">Scrolling content</ModalTitle>
              <ModalDescription className="font-body text-sm text-karis-stone-500">
                Header and footer stay pinned. Body scrolls when content overflows.
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-3">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-karis-stone-100 flex items-center px-3">
                    <span className="font-body text-xs text-karis-stone-500">Row {i + 1}</span>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" size="sm" onClick={() => setScrolling(false)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 4 — No backdrop dismiss */}
        <Button onClick={() => setNoBackdrop(true)} variant="outline" className="font-body text-sm">No backdrop dismiss</Button>
        <Modal open={noBackdrop} onOpenChange={setNoBackdrop}>
          <ModalContent dismissOnBackdrop={false}>
            <ModalHeader>
              <ModalTitle className="font-heading text-karis-green-900">Requires explicit action</ModalTitle>
              <ModalDescription className="font-body text-sm text-karis-stone-500">
                Clicking outside does not close. Use the buttons or Esc key.
              </ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <Button variant="outline" size="sm" onClick={() => setNoBackdrop(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => setNoBackdrop(false)}>Destructive action</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>

      <p className="font-body text-xs text-karis-stone-400">
        Test at 360 px, 768 px, 1280 px. Verify: no edge bleed, scroll containment, focus trap (Tab cycles inside), Esc closes.
      </p>
    </div>
  )
}
