import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Overlays must render at document.body, outside the .screen scroller.
 * position:fixed inside an iOS momentum-scroll container stacks and clips
 * unreliably — sheets ended up painted underneath the tab bar, and a sheet
 * short enough not to scroll handed swipes to the page behind it.
 */
export function Overlay({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

export default function Sheet({ title, onClose, children }: { title?: string; onClose: () => void; children: ReactNode }) {
  return (
    <Overlay>
      <div className="sheet-back" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          {title && <div className="sheet-title">{title}</div>}
          {children}
        </div>
      </div>
    </Overlay>
  )
}
