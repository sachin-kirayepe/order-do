/**
 * Analyzes a canvas for brightness and blur.
 */
export function analyzeEnvironment(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let totalLuma = 0;
  
  // Brightness check (Average Luma)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    // Standard luma weights
    totalLuma += (0.299 * r + 0.587 * g + 0.114 * b);
  }
  const avgLuma = totalLuma / (width * height);
  
  // Simple Blur check (Variance of Laplacian approximation)
  // We check contrast in a small 100x100 patch in the center
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const patchSize = 50;
  let variance = 0;
  let count = 0;
  for (let y = centerY - patchSize; y < centerY + patchSize; y += 2) {
    let rowPrevLuma = -1; // Reset for each row to avoid jumps
    for (let x = centerX - patchSize; x < centerX + patchSize; x += 2) {
      const idx = (y * width + x) * 4;
      const luma = (0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2]);
      if (rowPrevLuma !== -1) {
        variance += Math.abs(luma - rowPrevLuma);
      }
      rowPrevLuma = luma;
      count++;
    }
  }
  const contrastScore = variance / count;

  return {
    brightness: avgLuma, // 0-255
    contrast: contrastScore, // ~0-100 (higher is sharper)
    isTooDark: avgLuma < 15,
    isTooBright: avgLuma > 220,
    isBlurry: contrastScore < 5
  };
}
