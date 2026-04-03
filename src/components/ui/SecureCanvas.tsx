import { useRef, useEffect, useCallback } from 'react';

interface SecureCanvasProps {
  content?: string | string[]; // Array of strings for multiline
  image?: string;
  width?: number;
  height?: number;
  className?: string;
  fontSize?: number;
  tagline?: string;
}

export default function SecureCanvas({ 
  content, 
  image, 
  width = 300, 
  height = 200, 
  className = "", 
  fontSize = 18,
  tagline = "Order-Do // Private"
}: SecureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 1. DRAW IMAGE (if any)
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        applySecurityLayers(ctx);
      };
    } else {
      // 2. DRAW TEXT
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textBaseline = 'top';

      if (Array.isArray(content)) {
        content.forEach((line, idx) => {
          ctx.fillText(line, 20, 20 + idx * (fontSize + 8));
        });
      } else if (content) {
        ctx.fillText(content, 20, 20);
      }
      
      applySecurityLayers(ctx);
    }
  }, [content, image, width, height, fontSize]);

  const applySecurityLayers = (ctx: CanvasRenderingContext2D) => {
    // 3. STEGANOGRAPHIC WATERMARK (Nearly Invisible)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.008)'; // 0.8% opacity
    ctx.font = '10px monospace';
    const watermarkText = `${tagline} • ${new Date().toISOString()} • ORDER-DO SEAMLESS PROTECTION`;
    for (let y = 0; y < height; y += 40) {
      for (let x = 0; x < width; x += 150) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();
      }
    }

    // 4. DYNAMIC NOISE OVERLAY (Visible only on close inspection/screenshot)
    const idata = ctx.getImageData(0, 0, width, height);
    const data = idata.data;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.05) { // 5% noise factor
           // Add slight variance to RGB
           data[i] = Math.min(255, data[i] + 5);
           data[i+1] = Math.min(255, data[i+1] + 5);
           data[i+2] = Math.min(255, data[i+2] + 5);
        }
    }
    ctx.putImageData(idata, 0, 0);
  };

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className={`secure-canvas-wrapper relative overflow-hidden rounded-2xl border-2 border-slate-100 dark:border-slate-800 select-none ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="block max-w-full h-auto pointer-events-none"
        aria-label="Secure content rendered on canvas"
      />
      {/* Noise animation layer (from CSS) */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.05] mix-blend-overlay secure-content" />
    </div>
  );
}
