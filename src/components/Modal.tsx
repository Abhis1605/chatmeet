'use client'

import { ReactNode } from "react"

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode
}

export default function Modal({ isOpen, onClose, children } : ModalProps){ 
    if (!isOpen) return null

    return (
        <div 
          onClick={onClose} // Fixed typo: onclose -> onClose
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
      {/* Modal Box */}
      <div onClick={(e) => e.stopPropagation()} className="bg-surface p-6 rounded-xl w-[90%] max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-muted hover:text-foreground"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
    )
}