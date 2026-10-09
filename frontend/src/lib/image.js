/**
 * Downscales and re-encodes an image in the browser. Re-encoding through a
 * canvas also strips metadata (EXIF location etc.) before upload.
 *
 * @param {File} file
 * @param {{ maxSize: number, type?: string, quality?: number, square?: boolean }} options
 * @returns {Promise<string>} data URL
 */
export async function compressImage(
  file,
  { maxSize, type = 'image/webp', quality = 0.85, square = false }
) {
  if (!file.type.startsWith('image/'))
    throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;
  if (square) {
    const side = Math.min(width, height);
    sx = (width - side) / 2;
    sy = (height - side) / 2;
    sw = sh = width = height = side;
  }
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas
    .getContext('2d')
    .drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL(type, quality);
  // Safari < 17 can't encode WebP and silently returns PNG; fall back to JPEG.
  return dataUrl.startsWith(`data:${type}`)
    ? dataUrl
    : canvas.toDataURL('image/jpeg', quality);
}
