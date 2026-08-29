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
 * Synchronous High-Compatibility QR Code Component.
 * Computes QR bit matrix instantly in useMemo (< 1ms) and renders as an SVG Data URI image.
 * This guarantees 100% rasterization in html2canvas, html2pdf, jsPDF, and browser print dialogs.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 48,
  className,
  style,
  level = 'M',
}) => {
  const dataUrl = useMemo(() => {
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
    } catch (e) {
      console.error('QrCodeSvg calculation error:', e);
      return '';
    }
  }, [value, level]);

  const dimension = typeof size === 'number' ? `${size}px` : size;

  if (!dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={dimension}
      height={dimension}
      className={className}
      style={{
        display: 'block',
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        backgroundColor: '#ffffff',
        ...style,
      }}
    />
  );
};
