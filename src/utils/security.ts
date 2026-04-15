/**
 * Core Security Utilities
 */

export async function hashString(text: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a Privacy-Safe Proof Image.
 * FIXED: Now applies a uniform heavy blur across the ENTIRE image.
 * No identifiable facial features are preserved.
 */
export function generateBlurredImage(dataUrl: string, blurRadius: number = 25): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = dataUrl;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            
            // Large downscale for performance and added "pixelation" blur
            const scale = 0.5;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            // Draw scaled down
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Apply heavy blur filter (uniform)
            ctx.filter = `blur(${blurRadius}px) grayscale(100%)`;
            ctx.drawImage(canvas, 0, 0);

            // Re-apply filter to really bake it in
            ctx.drawImage(canvas, 0, 0);

            resolve(canvas.toDataURL('image/jpeg', 0.4)); // Low quality for proof
        };
        img.onerror = reject;
    });
}
