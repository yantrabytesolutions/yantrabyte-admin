/// <reference types="vite/client" />

declare module 'qrcode' {
  export interface QRCodeBitMatrix {
    size: number;
    data: Uint8Array;
    reservedBit: Uint8Array;
    get(row: number, col: number): number | boolean;
    set(row: number, col: number, value: number, reserved?: boolean): void;
  }

  export interface QRCodeObject {
    modules: QRCodeBitMatrix;
    version: number;
    errorCorrectionLevel: { bit: number };
    maskPattern: any;
    segments: any[];
  }

  export interface QRCodeOptions {
    version?: number;
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    maskPattern?: number;
    toSJISFunc?: Function;
  }

  export interface QRCodeToDataURLOptions extends QRCodeOptions {
    width?: number;
    margin?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function create(text: string | QRCodeSegment[], options?: QRCodeOptions): QRCodeObject;
  export function toDataURL(text: string | Buffer, options?: QRCodeToDataURLOptions): Promise<string>;
  export function toDataURL(text: string | Buffer, callback: (err: any, url: string) => void): void;
  export function toDataURL(text: string | Buffer, options: QRCodeToDataURLOptions, callback: (err: any, url: string) => void): void;
}
