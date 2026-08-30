import React, { useState, useEffect } from 'react';
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
  size = 48,
  className,
  style,
  level = 'M',
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  
  const dimension = typeof size === 'number' ? size : parseInt(size.toString(), 10) || 48;

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }
    
    QRCode.toDataURL(value, {
      errorCorrectionLevel: level,
      margin: 1,
      width: dimension,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    .then(url => setDataUrl(url))
    .catch(err => {
      console.error('QR Code generation failed:', err);
      setDataUrl(null);
    });
  }, [value, level, dimension]);

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
        width: `${dimension}px`,
        height: `${dimension}px`,
        minWidth: `${dimension}px`,
        minHeight: `${dimension}px`,
        backgroundColor: '#ffffff',
        ...style,
      }}
    />
  );
};
