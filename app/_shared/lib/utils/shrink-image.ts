/**
 * Shrinks a photo in the browser to fit within maxDimension and re-encodes it as JPEG.
 * Drawing to a canvas also drops EXIF data such as GPS coordinates.
 * Returns null if the browser cannot decode the image (for example HEIC outside Safari).
 */
export async function shrinkImage(file: File, maxDimension: number): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return null;
  }

  // JPEG has no transparency; a white background keeps transparent PNGs from turning black.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}
