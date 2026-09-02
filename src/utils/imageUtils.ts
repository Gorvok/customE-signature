/** Upper bounds for uploaded logos, checked before reading and after decoding. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 4096;

/** A user-facing reason the file cannot be used, or null when it can. */
export function checkImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'That file is not an image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be under 5 MB.';
  return null;
}

/**
 * Decode an image file, scale it so its longer side is at most `maxSize`
 * pixels, and return it as a PNG data URL. Rasterizing through a canvas also
 * strips anything embedded in the source file, such as SVG scripts or EXIF.
 * Rejects with a user-facing Error message on any failure.
 */
export function fileToBase64(file: File, maxSize = 200): Promise<string> {
  const problem = checkImageFile(file);
  if (problem) return Promise.reject(new Error(problem));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
          reject(new Error(`Images must be at most ${MAX_IMAGE_DIMENSION} pixels on each side.`));
          return;
        }
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Your browser could not process the image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Could not decode that image.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}
