import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Toasts portal to document.body for the same reason as sheets — fixed
 *  positioning inside the .screen scroller is unreliable on iOS. */
export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return createPortal(<div className="toast">{msg}</div>, document.body)
}

export function useToast(): [string | null, (msg: string) => void] {
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])
  return [toast, show]
}
