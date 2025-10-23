'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
  loading?: boolean
}

/**
 * Reusable Confirmation Dialog
 * Replaces native browser alert() and confirm() with a better UX
 *
 * ANTI-PATTERN FIX: Browser alert/confirm blocks JavaScript execution and provides poor UX
 * This component provides proper async handling and styling
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Eliminar campaña"
 *   description="¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer."
 *   confirmText="Eliminar"
 *   cancelText="Cancelar"
 *   variant="destructive"
 *   onConfirm={async () => {
 *     await deleteCampaign(id)
 *     toast.success('Campaña eliminada')
 *   }}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'default',
  loading = false
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Custom hook for using ConfirmDialog
 *
 * @example
 * const confirmDelete = useConfirm()
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirmDelete({
 *     title: 'Eliminar item',
 *     description: '¿Estás seguro?',
 *     variant: 'destructive'
 *   })
 *   if (confirmed) {
 *     await deleteItem()
 *   }
 * }
 */
export function useConfirm() {
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, 'onOpenChange' | 'onConfirm' | 'open'> | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((dialogConfig: Omit<ConfirmDialogProps, 'onOpenChange' | 'onConfirm' | 'open'>) => {
    setConfig(dialogConfig)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true)
    setIsOpen(false)
  }, [])

  const handleCancel = React.useCallback((open: boolean) => {
    if (!open) {
      resolveRef.current?.(false)
    }
    setIsOpen(open)
  }, [])

  const ConfirmDialogComponent = React.useMemo(() => {
    if (!config) return null

    return (
      <ConfirmDialog
        {...config}
        open={isOpen}
        onOpenChange={handleCancel}
        onConfirm={handleConfirm}
      />
    )
  }, [config, isOpen, handleCancel, handleConfirm])

  return {
    confirm,
    ConfirmDialogComponent
  }
}
