import sharp from 'sharp'
import { createHash } from 'crypto'

/**
 * File validation utilities for secure image uploads
 */

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION: 4096, // 4096px
  MIN_SIZE: 1024, // 1KB (prevents tiny/corrupted files)
  ALLOWED_FORMATS: ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'] as const,
  OUTPUT_FORMAT: 'jpeg' as const,
  OUTPUT_QUALITY: 90,
}

export interface FileValidationResult {
  success: boolean
  error?: string
  buffer?: Buffer
  metadata?: {
    width: number
    height: number
    format: string
    size: number
  }
}

/**
 * Validate and sanitize image file
 * - Verifies file is actually an image (magic bytes)
 * - Validates format, size, and dimensions
 * - Strips EXIF data and re-encodes to prevent exploits
 * - Returns sanitized image buffer ready for upload
 */
export async function validateAndSanitizeImage(
  fileData: string,
  options?: {
    maxSize?: number
    maxDimension?: number
  }
): Promise<FileValidationResult> {
  try {
    // 1. Parse base64 data
    const base64Match = fileData.match(/^data:([^;]+);base64,(.+)$/)
    if (!base64Match) {
      return {
        success: false,
        error: 'Ugyldig filformat. Last opp et bilde (JPEG, PNG, eller WebP).',
      }
    }

    const [, mimeType, base64Data] = base64Match
    const buffer = Buffer.from(base64Data, 'base64')

    // 2. Validate file size BEFORE processing
    const maxSize = options?.maxSize ?? FILE_CONSTRAINTS.MAX_SIZE
    if (buffer.length > maxSize) {
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(1)
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
      return {
        success: false,
        error: `Filen er for stor: ${sizeMB}MB (maks ${maxSizeMB}MB)`,
      }
    }

    if (buffer.length < FILE_CONSTRAINTS.MIN_SIZE) {
      return {
        success: false,
        error: 'Filen er for liten eller korrupt.',
      }
    }

    // 3. Verify it's actually an image using sharp (validates magic bytes)
    let metadata: sharp.Metadata
    try {
      metadata = await sharp(buffer).metadata()
    } catch (err) {
      return {
        success: false,
        error: 'Ugyldig bildefil. Filen ser ikke ut til å være et gyldig bilde.',
      }
    }

    // 4. Validate image format (reject SVG and other potentially dangerous formats)
    if (!metadata.format || !FILE_CONSTRAINTS.ALLOWED_FORMATS.includes(metadata.format as any)) {
      return {
        success: false,
        error: `Ugyldig format: ${metadata.format}. Kun JPEG, PNG, og WebP er tillatt.`,
      }
    }

    // 5. Validate image dimensions
    const maxDimension = options?.maxDimension ?? FILE_CONSTRAINTS.MAX_DIMENSION
    if (!metadata.width || !metadata.height) {
      return {
        success: false,
        error: 'Kan ikke lese bildedimensjoner.',
      }
    }

    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      return {
        success: false,
        error: `Bildet er for stort: ${metadata.width}x${metadata.height}px (maks ${maxDimension}px)`,
      }
    }

    // 6. Re-encode image to strip EXIF metadata and ensure safety
    // This also validates the image content (will fail if malformed)
    const safeBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation (before stripping)
      .resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: FILE_CONSTRAINTS.OUTPUT_QUALITY,
        mozjpeg: true, // Better compression
      })
      .toBuffer()

    return {
      success: true,
      buffer: safeBuffer,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: safeBuffer.length,
      },
    }
  } catch (error) {
    console.error('[File Validation] Unexpected error:', error)
    return {
      success: false,
      error: 'Kunne ikke behandle bildefilen. Prøv et annet bilde.',
    }
  }
}

/**
 * Generate secure filename
 * - Uses content hash to prevent duplicates
 * - Includes timestamp for uniqueness
 * - No user-controlled characters
 */
export function generateSecureFilename(
  buffer: Buffer,
  participantId: string,
  extension: string = 'jpg'
): string {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16)
  const timestamp = Date.now()
  return `${participantId}-${timestamp}-${hash}.${extension}`
}

/**
 * Validate file type from MIME type
 * Additional validation beyond Sharp's format detection
 */
export function isValidMimeType(mimeType: string): boolean {
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]
  return validMimeTypes.includes(mimeType.toLowerCase())
}

/**
 * Estimate processing time for large images
 * Useful for setting appropriate timeouts
 */
export function estimateProcessingTime(fileSizeBytes: number): number {
  // Rough estimate: 1MB = 1 second processing time
  const estimatedSeconds = Math.ceil(fileSizeBytes / (1024 * 1024))
  return Math.min(estimatedSeconds * 1000, 30000) // Max 30 seconds
}
