import { useRef, useEffect, useCallback } from 'react';

interface SecureCanvasProps {
  content?: string | string[]; // Array of strings for multiline
  image?: string;
  width?: number;
  height?: number;
  className?: string;
  fontSize?: number;
  tagline?: string;
  textAlign?: 'left' | 'center' | 'right';
  shopName?: string;
}

export default function SecureCanvas({ 
  content, 
  image, 
  width = 300, 
  height = 200, 
  className = "", 
  fontSize = 18,
  tagline = "Order-Do // Private",
  textAlign = 'left',
  shopName = "Order-Do Cloud"
}: SecureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applySecurityLayers = useCallback((ctx: CanvasRenderingContext2D) => {
    // 3. PROMINENT FORENSIC WATERMARK (Diagonal & Visible)
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // More visible
    ctx.font = 'black 14px "Outfit", sans-serif';
    const watermarkText = `PROPERTY OF ${shopName.toUpperCase()} // FORENSIC LOG ACTIVE`;
    
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 4); // 45 degree angle
    
    // Draw multiple lines if it's a large canvas (like image)
    if (image) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // White watermark on photos
        for(let i = -3; i <= 3; i++) {
            ctx.fillText(watermarkText, -width, i * 40);
        }
    } else {
        ctx.fillText(watermarkText, -width/1.5, 0);
    }
    ctx.restore();

    // 4. STEGANOGRAPHIC NOISE WATERMARK (Subtle)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
    ctx.font = 'bold 8px monospace';
    const hiddenText = `${tagline} • ${new Date().toLocaleTimeString()} • ${Math.random().toString(36).substring(7)}`;
    
    for (let y = 0; y < height; y += 100) {
      for (let x = 0; x < width; x += 180) {
        ctx.fillText(hiddenText, x, y);
      }
    }
    ctx.restore();

    // 4. STATIC NOISE OVERLAY (Simpler, faster)
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }
    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, tagline]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Clear and draw background
    const isTransparent = className.includes('bg-transparent');
    const isDark = document.documentElement.classList.contains('dark');

    if (!isTransparent) {
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        applySecurityLayers(ctx);
      };
    } else {
      // Dynamic text color based on theme and background
      ctx.fillStyle = isTransparent 
        ? (isDark ? '#e2e8f0' : '#0f172a') 
        : (isDark ? '#64748b' : '#0f172a');
        
      ctx.font = `bold ${fontSize}px "Outfit", "Inter", sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = textAlign;

      const xPos = textAlign === 'center' ? width / 2 : textAlign === 'right' ? width : 0;

      if (Array.isArray(content)) {
        content.forEach((line, idx) => {
          ctx.fillText(line, xPos, 0 + idx * (fontSize + 4));
        });
      } else if (content) {
        ctx.fillText(content, xPos, 0);
      }
      
      applySecurityLayers(ctx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, image, width, height, fontSize, textAlign, applySecurityLayers]);

  useEffect(() => {
    draw();
  }, [draw]);

  const hasBorder = !className.includes('border-none');

  return (
    <div className={`secure-canvas-wrapper relative overflow-hidden select-none ${hasBorder ? 'rounded-2xl border-2 border-slate-100 dark:border-slate-800' : ''} ${className}`}>
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
