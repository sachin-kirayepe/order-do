import type { OrderItem } from '../db/dexie';

export interface ReceiptData {
  shopName: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  orderId: string;
  date: string;
}

/**
 * Generates a professional digital receipt image using HTML5 Canvas.
 */
export async function generateReceiptCanvas(data: ReceiptData): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const width = 400;
  const itemHeight = 30;
  const padding = 40;
  const headerHeight = 120;
  const footerHeight = 80;
  const totalHeight = headerHeight + (data.items.length * itemHeight) + footerHeight + padding;

  canvas.width = width;
  canvas.height = totalHeight;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, width - 10, totalHeight - 10);

  // Header - Shop Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.shopName.toUpperCase(), width / 2, 50);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  ctx.fillText('DIGITAL RECEIPT', width / 2, 75);
  
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, 95);
  ctx.lineTo(width - padding, 95);
  ctx.stroke();

  // Info Section
  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`CUSTOMER: ${data.customerName}`, padding, 120);
  ctx.textAlign = 'right';
  ctx.fillText(data.date, width - padding, 120);

  // Items Header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('ITEM', padding, 150);
  ctx.textAlign = 'right';
  ctx.fillText('QTY', width - padding - 60, 150);
  ctx.fillText('PRICE', width - padding, 150);

  // Items List
  let currentY = 175;
  ctx.fillStyle = '#1e293b';
  // Enhanced font stack for Hindi support
  ctx.font = '14px "Noto Sans Devanagari", "Inter", sans-serif';
  
  data.items.forEach((item) => {
    ctx.textAlign = 'left';
    // Truncate long item names to prevent overlap
    const displayName = item.name.length > 30 ? item.name.slice(0, 27) + '...' : item.name;
    ctx.fillText(displayName, padding, currentY);
    
    ctx.textAlign = 'right';
    ctx.fillText(item.quantity, width - padding - 60, currentY);
    if (item.price) {
      ctx.fillText(`₹${item.price}`, width - padding, currentY);
    } else {
      ctx.fillText('-', width - padding, currentY);
    }
    currentY += itemHeight;
  });

  // Footer Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(padding, currentY + 10);
  ctx.lineTo(width - padding, currentY + 10);
  ctx.stroke();

  // Total
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL:', padding, currentY + 45);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${data.total}`, width - padding, currentY + 45);

  // Branding
  ctx.fillStyle = '#059669';
  ctx.font = 'italic bold 12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ordered via Order-Do App', width / 2, totalHeight - 30);

  return canvas.toDataURL('image/png');
}
