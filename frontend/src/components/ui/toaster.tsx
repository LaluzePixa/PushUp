"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      expand={true}
      toastOptions={{
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
        className: 'group',
        duration: 5000,
      }}
    />
  )
}
