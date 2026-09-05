import React, { useEffect, useRef, useState, useMemo } from 'react';
import QRCode from 'qrcode';

interface QrCodeRendererProps {
  value: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  value,
  size = 80,
  className,
  style
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  const { pathData, totalDim } = useMemo(() => {
    if (!value) return { pathData: '', totalDim: 0 };
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
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
      console.error('QR Code error:', e);
      return { pathData: '', totalDim: 0 };
    }
  }, [value]);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      const margin = 1;
      const total = count + margin * 2;
      const canvas = canvasRef.current;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        const moduleSize = size / total;
        ctx.fillStyle = '#000000';
        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.modules.get(r, c)) {
              ctx.fillRect(
                (c + margin) * moduleSize,
                (r + margin) * moduleSize,
                moduleSize + 0.3,
                moduleSize + 0.3
              );
            }
          }
        }
      }
    } catch (e) {
      console.error('Canvas draw error:', e);
    }

    try {
      QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 1, width: size }, (err: Error | null, url: string) => {
        if (!err && url) setDataUrl(url);
      });
    } catch (e) {}
  }, [value, size]);

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, background: '#ffffff', ...style }} className={className}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
      />
      {pathData && totalDim > 0 && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${totalDim} ${totalDim}`}
          width={size}
          height={size}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${size}px`,
            height: `${size}px`,
            display: 'block'
          }}
        >
          <rect width={totalDim} height={totalDim} fill="#ffffff" />
          <path d={pathData} fill="#000000" shapeRendering="crispEdges" />
        </svg>
      )}
      {dataUrl && (
        <img
          src={dataUrl}
          alt="QR Code"
          width={size}
          height={size}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${size}px`,
            height: `${size}px`,
            opacity: 0.01,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};
