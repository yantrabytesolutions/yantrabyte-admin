/// <reference types="vite/client" />

declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
  }

  export function toDataURL(text: string | Buffer, options?: QRCodeToDataURLOptions): Promise<string>;
  export function toDataURL(text: string | Buffer, callback: (err: any, url: string) => void): void;
  export function toDataURL(text: string | Buffer, options: QRCodeToDataURLOptions, callback: (err: any, url: string) => void): void;
}
