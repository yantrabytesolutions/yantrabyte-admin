import React, { useMemo } from 'react';
import QRCode from 'qrcode';

export interface QrCodeSvgProps {
  value: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  level?: 'L' | 'M' | 'Q' | 'H';
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

/**
 * Synchronous React SVG QR Code Component.
 * Guaranteed to render immediately on the first paint without async delay or canvas context loss.
 * Fully compatible with html2canvas, html2pdf, jsPDF, and browser print.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 48,
  className,
  style,
  level = 'M',
}) => {
  const { path, totalSize } = useMemo(() => {
    try {
      if (!value) return { path: '', totalSize: 23 };
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
      return { path: p, totalSize: mSize + 2 };
    } catch (e) {
      console.error('QrCodeSvg calculation error:', e);
      return { path: '', totalSize: 23 };
    }
  }, [value, level]);

  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={dimension}
      height={dimension}
      className={className}
      style={{
        display: 'block',
        backgroundColor: '#ffffff',
        ...style,
      }}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      {path && <path d={path} fill="#000000" />}
    </svg>
  );
};
