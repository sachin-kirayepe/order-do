/**
 * Compress an image dataUrl to target max size using canvas.
 * Repeatedly lowers quality until below maxBytes.
 */
export async function compressPhoto(
  dataUrl: string,
  maxBytes: number = 150 * 1024, // 150KB
  maxWidth: number = 800
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Scale down if wider than maxWidth
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      // Try progressively lower quality until under maxBytes
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);

      while (result.length > maxBytes * 1.37 && quality > 0.1) {
        // 1.37 factor: base64 overhead
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(result);
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}
