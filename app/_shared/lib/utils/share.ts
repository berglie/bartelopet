/**
 * Share utility functions for sharing content on social media
 */

export interface ShareData {
  title: string
  text: string
  url: string
  imageUrl?: string
}

/**
 * Share using the native Web Share API (mobile-friendly)
 * Falls back to copying link if not supported
 */
export async function shareNative(data: ShareData): Promise<boolean> {
  if (typeof navigator === 'undefined') return false

  // Check if Web Share API is supported
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
      return true
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name === 'AbortError') {
        return false
      }
      console.error('Error sharing:', error)
      return false
    }
  }

  // Fallback: copy to clipboard
  return copyToClipboard(data.url)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate share URLs for different social media platforms
 */
export function getShareUrls(data: ShareData) {
  const encodedUrl = encodeURIComponent(data.url)
  const encodedText = encodeURIComponent(data.text)
  const encodedTitle = encodeURIComponent(data.title)

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}&title=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  }
}

/**
 * Open share dialog in a popup window
 */
export function openSharePopup(url: string, width = 600, height = 400) {
  if (typeof window === 'undefined') return

  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2

  window.open(
    url,
    'share',
    `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
  )
}

/**
 * Create shareable data for a photo completion
 */
export function createPhotoShareData(
  completionId: string,
  participantName: string,
  imageUrl?: string
): ShareData {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://barteløpet.no'}/galleri?id=${completionId}`

  return {
    title: `${participantName}s løp - Barteløpet`,
    text: `Sjekk ut ${participantName}s bilde fra Barteløpet! 🏃‍♂️`,
    url,
    imageUrl,
  }
}
