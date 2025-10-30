import { useEffect } from 'react'

interface UseKeyboardNavProps {
  enabled: boolean
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}

/**
 * Custom hook for keyboard navigation in the image viewer
 * Handles Arrow Left/Right, ESC, and h/l (vim style)
 */
export function useKeyboardNav({
  enabled,
  onPrevious,
  onNext,
  onClose,
}: UseKeyboardNavProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid page scrolling
      if (['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
        event.preventDefault()
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'h': // vim-style navigation
          onPrevious()
          break
        case 'ArrowRight':
        case 'l': // vim-style navigation
          onNext()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onPrevious, onNext, onClose])
}
