"use client"

import * as React from "react"
import { Dialog as ModalPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Modal({ ...props }: ModalPrimitive.Root.Props) {
  return <ModalPrimitive.Root data-slot="modal" {...props} />
}

function ModalTrigger({ ...props }: ModalPrimitive.Trigger.Props) {
  return <ModalPrimitive.Trigger data-slot="modal-trigger" {...props} />
}

function ModalPortal({ ...props }: ModalPrimitive.Portal.Props) {
  return <ModalPrimitive.Portal data-slot="modal-portal" {...props} />
}

function ModalClose({ ...props }: ModalPrimitive.Close.Props) {
  return <ModalPrimitive.Close data-slot="modal-close" {...props} />
}

function ModalOverlay({
  className,
  dismissOnBackdrop,
  ...props
}: ModalPrimitive.Backdrop.Props & { dismissOnBackdrop?: boolean }) {
  if (dismissOnBackdrop === false) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 bg-karis-stone-900/40 pointer-events-none",
          className
        )}
        aria-hidden="true"
      />
    )
  }
  return (
    <ModalPrimitive.Backdrop
      data-slot="modal-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-karis-stone-900/40",
        "duration-200 motion-reduce:!duration-0",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

type PopupOnKeyDown = NonNullable<ModalPrimitive.Popup.Props["onKeyDown"]>

function ModalContent({
  className,
  children,
  size = "default",
  showCloseButton = true,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  onKeyDown,
  ...props
}: ModalPrimitive.Popup.Props & {
  size?: "default" | "lg"
  showCloseButton?: boolean
  dismissOnBackdrop?: boolean
  dismissOnEscape?: boolean
}) {
  const handleKeyDown: PopupOnKeyDown = (e) => {
    if (!dismissOnEscape && e.key === "Escape") {
      e.preventBaseUIHandler()
    }
    onKeyDown?.(e)
  }

  return (
    <ModalPortal>
      <ModalOverlay dismissOnBackdrop={dismissOnBackdrop} />
      <ModalPrimitive.Popup
        data-slot="modal-content"
        data-size={size}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "flex flex-col w-full max-h-[90dvh]",
          "rounded-xl bg-white",
          "shadow-[0_4px_16px_rgba(31,46,38,0.08)] ring-1 ring-karis-stone-300/30",
          "p-6 md:p-8",
          "duration-200 outline-none motion-reduce:!duration-0",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          size === "default" && "max-w-[min(560px,calc(100vw-32px))]",
          size === "lg" && "max-w-[min(720px,calc(100vw-32px))]",
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        {showCloseButton && (
          <ModalPrimitive.Close
            data-slot="modal-close-button"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </ModalPrimitive.Close>
        )}
      </ModalPrimitive.Popup>
    </ModalPortal>
  )
}

function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-header"
      className={cn("flex flex-col gap-1 shrink-0 pb-4", className)}
      {...props}
    />
  )
}

function ModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-body"
      className={cn("flex-1 overflow-y-auto min-h-0", className)}
      {...props}
    />
  )
}

function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "flex items-center justify-end gap-2 shrink-0 pt-4 border-t border-karis-stone-100",
        className
      )}
      {...props}
    />
  )
}

function ModalTitle({ className, ...props }: ModalPrimitive.Title.Props) {
  return (
    <ModalPrimitive.Title
      data-slot="modal-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function ModalDescription({ className, ...props }: ModalPrimitive.Description.Props) {
  return (
    <ModalPrimitive.Description
      data-slot="modal-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
}
