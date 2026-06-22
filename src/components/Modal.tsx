'use client'

import { ReactNode } from "react"

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode
}

export default function Model({ isOpen, onClose, children } : ModalProps){
    if (!isOpen) return null

    return (
        <div onClick={onclose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Modal Box */}
      <div onClick={(e) => e.stopPropagation()} className="bg-[#1f2937] p-6 rounded-xl w-[90%] max-w-md relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
    )
}