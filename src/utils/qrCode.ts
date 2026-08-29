import QRCode from 'qrcode';

/**
 * Generates an inline SVG string for a QR code synchronously.
 * Ideal for raw HTML templates, document.write, or print element builders.
 */
export function getQrSvgString(
  value: string,
  size: number = 52,
  level: 'L' | 'M' | 'Q' | 'H' = 'M'
): string {
  try {
    if (!value) return '';
    const qr = (QRCode as any).create(value, { errorCorrectionLevel: level });
    const mSize = qr.modules.size;
    let p = '';
    for (let r = 0; r < mSize; r++) {
      for (let c = 0; c < mSize; c++) {
        if (qr.modules.get(r, c)) {
          p += `M${c + 1},${r + 1}h1v1h-1z `;
        }
      }
    }
    const totalSize = mSize + 2; // 1-module quiet zone margin
    return `<svg viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" style="display:block;background:#ffffff;border-radius:2px;" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff" /><path d="${p}" fill="#000000" /></svg>`;
  } catch (err) {
    console.error('getQrSvgString error:', err);
    return '';
  }
}
