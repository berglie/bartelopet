// Image upload constants and validation rules

export const IMAGE_CONSTRAINTS = {
  // File count limits
  MAX_IMAGES_PER_COMPLETION: 10,
  MIN_IMAGES_PER_COMPLETION: 1,

  // File size limits (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024,        // 10MB per image
  MIN_FILE_SIZE: 1024,                     // 1KB minimum
  MAX_TOTAL_SIZE: 50 * 1024 * 1024,       // 50MB total per completion

  // Allowed file types
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.heic'],

  // Image dimensions
  MAX_DIMENSION: 4096,                     // Max width/height (px)
  MIN_DIMENSION: 200,                      // Min width/height (px)
  THUMBNAIL_SIZE: 400,                     // Thumbnail size for previews

  // Metadata limits
  MAX_CAPTION_LENGTH: 200,

  // Star validation
  EXACTLY_ONE_STARRED: true,
} as const

export type ImageConstraints = typeof IMAGE_CONSTRAINTS

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Validation error types
export type ValidationErrorType =
  | 'too_many_files'
  | 'too_few_files'
  | 'file_too_large'
  | 'file_too_small'
  | 'total_size_exceeded'
  | 'invalid_type'
  | 'invalid_extension'
  | 'no_starred_image'
  | 'multiple_starred_images'
  | 'caption_too_long'

export interface ValidationError {
  type: ValidationErrorType
  message: string
  fileName?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Validate multiple files
export function validateImageFiles(
  files: File[],
  existingImageCount: number = 0
): ValidationResult {
  const errors: ValidationError[] = []

  // Check count
  const totalCount = files.length + existingImageCount
  if (totalCount < IMAGE_CONSTRAINTS.MIN_IMAGES_PER_COMPLETION) {
    errors.push({
      type: 'too_few_files',
      message: 'Minst ett bilde er påkrevd',
    })
  }
  if (totalCount > IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION) {
    errors.push({
      type: 'too_many_files',
      message: `Maksimalt ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION} bilder tillatt`,
    })
  }

  // Check individual files
  for (const file of files) {
    // Size check
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
      errors.push({
        type: 'file_too_large',
        message: `${file.name} er for stort (maks ${formatFileSize(IMAGE_CONSTRAINTS.MAX_FILE_SIZE)})`,
        fileName: file.name,
      })
    }
    if (file.size < IMAGE_CONSTRAINTS.MIN_FILE_SIZE) {
      errors.push({
        type: 'file_too_small',
        message: `${file.name} er for lite`,
        fileName: file.name,
      })
    }

    // Type check
    if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as any)) {
      errors.push({
        type: 'invalid_type',
        message: `${file.name} har ugyldig filtype (kun JPEG, PNG, WebP tillatt)`,
        fileName: file.name,
      })
    }

    // Extension check
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!IMAGE_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(ext as any)) {
      errors.push({
        type: 'invalid_extension',
        message: `${file.name} har ugyldig filendelse`,
        fileName: file.name,
      })
    }
  }

  // Check total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  if (totalSize > IMAGE_CONSTRAINTS.MAX_TOTAL_SIZE) {
    errors.push({
      type: 'total_size_exceeded',
      message: `Total filstørrelse overstiger ${formatFileSize(IMAGE_CONSTRAINTS.MAX_TOTAL_SIZE)}`,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate star selection
export function validateStarSelection(images: Array<{ isStarred: boolean }>): ValidationResult {
  const starredCount = images.filter((img) => img.isStarred).length

  if (starredCount === 0) {
    return {
      valid: false,
      errors: [
        {
          type: 'no_starred_image',
          message: 'Du må velge ett hovedbilde',
        },
      ],
    }
  }

  if (starredCount > 1) {
    return {
      valid: false,
      errors: [
        {
          type: 'multiple_starred_images',
          message: 'Kun ett bilde kan være hovedbilde',
        },
      ],
    }
  }

  return {
    valid: true,
    errors: [],
  }
}

// Validate caption length
export function validateCaption(caption: string | null | undefined): ValidationResult {
  if (!caption) {
    return { valid: true, errors: [] }
  }

  if (caption.length > IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH) {
    return {
      valid: false,
      errors: [
        {
          type: 'caption_too_long',
          message: `Bildetekst kan ikke være lengre enn ${IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH} tegn`,
        },
      ],
    }
  }

  return { valid: true, errors: [] }
}
