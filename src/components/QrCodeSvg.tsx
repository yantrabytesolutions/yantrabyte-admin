import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

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
  const dimension = typeof size === 'number' ? size : parseInt(size.toString(), 10) || 48;

  if (!value) return null;

  return (
    <QRCodeCanvas
      value={value}
      size={dimension}
      level={level}
      marginSize={1}
      className={className}
      style={{
        display: 'block',
        width: `${dimension}px`,
        height: `${dimension}px`,
        backgroundColor: '#ffffff',
        ...style,
      }}
    />
  );
};

