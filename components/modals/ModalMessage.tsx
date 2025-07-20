'use client'

import { useEffect } from 'react'

interface ModalMessageProps {
  message: string | null
  show: boolean
  onClose: () => void
  duration?: number // in ms
}

export default function ModalMessage({
  message,
  show,
  onClose,
  duration = 3000,
}: ModalMessageProps) {
  useEffect(() => {
    if (show && message) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, message, duration, onClose])

  if (!show || !message) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white px-4 py-2 rounded shadow border border-gray-300">
        <p className="text-center text-gray-800 font-medium">{message}</p>
      </div>
    </div>
  )
}
