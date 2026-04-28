'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import { PromotionForm } from './promotion-form'

export function NewPromotionModal() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-1.5 min-h-[40px]">
        <Plus size={14} />
        New promotion
      </Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>New Promotion</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <PromotionForm onSuccess={() => setOpen(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
