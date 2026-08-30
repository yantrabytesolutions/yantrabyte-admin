import React, { useMemo } from 'react';
import QRCode from 'qrcode';

export interface QrCodeSvgProps {
  value: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 76,
  className,
  style,
  level = 'M',
}) => {
  const dimension = typeof size === 'number' ? size : parseInt(size.toString(), 10) || 76;

  const { pathData, totalDim } = useMemo(() => {
    if (!value) return { pathData: '', totalDim: 0 };
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: level });
      const count = qr.modules.size;
      const margin = 1;
      const total = count + margin * 2;
      const cellSize = 4;
      const dim = total * cellSize;
      let d = '';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.modules.get(r, c)) {
            const x = (c + margin) * cellSize;
            const y = (r + margin) * cellSize;
            d += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
          }
        }
      }
      return { pathData: d, totalDim: dim };
    } catch (e) {
      console.error('QR Code generation error:', e);
      return { pathData: '', totalDim: 0 };
    }
  }, [value, level]);

  if (!pathData || !totalDim) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalDim} ${totalDim}`}
      width={dimension}
      height={dimension}
      className={className}
      style={{
        display: 'block',
        width: `${dimension}px`,
        height: `${dimension}px`,
        minWidth: `${dimension}px`,
        minHeight: `${dimension}px`,
        backgroundColor: '#ffffff',
        ...style,
      }}
    >
      <rect width={totalDim} height={totalDim} fill="#ffffff" />
      <path d={pathData} fill="#000000" shapeRendering="crispEdges" />
    </svg>
  );
};


