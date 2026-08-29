import QRCode from 'qrcode';

/**
 * Generates an SVG Data URI for a QR code synchronously.
 * Fully compatible with HTML img src and html2canvas.
 */
export function getQrSvgDataUrl(
  value: string,
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
    const totalSize = mSize + 2;
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${p}" fill="#000000"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
  } catch (err) {
    console.error('getQrSvgDataUrl error:', err);
    return '';
  }
}

/**
 * Generates an inline SVG string for a QR code synchronously.
 * Ideal for raw HTML templates, document.write, or print element builders.
 */
export function getQrSvgString(
  value: string,
  size: number = 52,
  level: 'L' | 'M' | 'Q' | 'H' = 'M'
): string {
  const dataUrl = getQrSvgDataUrl(value, level);
  if (!dataUrl) return '';
  return `<img src="${dataUrl}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;min-width:${size}px;min-height:${size}px;background:#ffffff;" alt="QR" />`;
}
