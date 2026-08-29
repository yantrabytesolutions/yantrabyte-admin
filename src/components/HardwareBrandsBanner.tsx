import React from 'react';

export interface HardwareBrandsBannerProps {
  compact?: boolean;
  title?: string;
  theme?: 'light' | 'bordered';
}

export const HardwareBrandsBanner: React.FC<HardwareBrandsBannerProps> = ({
  compact = false,
  title = 'MULTI-BRAND SALES & IT HARDWARE SERVICE SUPPORT',
  theme = 'bordered'
}) => {
  return (
    <div
      style={{
        marginTop: compact ? '6px' : '10px',
        border: theme === 'bordered' ? '1px solid #0B5394' : 'none',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      {/* Banner Header Strip */}
      <div
        style={{
          backgroundColor: '#0B5394',
          color: '#ffffff',
          fontSize: compact ? '8.5px' : '9.5px',
          fontWeight: '700',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '2.5px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <span>★</span>
        <span>{title}</span>
        <span>★</span>
      </div>

      {/* Brand Logos Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: compact ? '4px 6px' : '6px 8px',
          backgroundColor: '#F8FAFC',
          gap: '4px 8px'
        }}
      >
        {/* DELL */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Dell">
          <svg viewBox="0 0 70 20" style={{ height: '14px', width: 'auto', display: 'block' }}>
            <text x="0" y="15" fontFamily="'Arial Black', Arial, sans-serif" fontSize="16" fontWeight="900" fill="#007DB8" letterSpacing="-0.5">D</text>
            <g transform="translate(16, 1) rotate(-18 5 9)">
              <text x="0" y="14" fontFamily="'Arial Black', Arial, sans-serif" fontSize="15" fontWeight="900" fill="#007DB8">E</text>
            </g>
            <text x="32" y="15" fontFamily="'Arial Black', Arial, sans-serif" fontSize="16" fontWeight="900" fill="#007DB8" letterSpacing="-0.5">LL</text>
          </svg>
        </div>

        {/* HP */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="HP">
          <svg viewBox="0 0 24 24" style={{ height: '16px', width: '16px', display: 'block' }}>
            <circle cx="12" cy="12" r="11" fill="#0096D6" />
            <text x="4.5" y="16" fontFamily="Arial, sans-serif" fontSize="13" fontStyle="italic" fontWeight="bold" fill="#ffffff" letterSpacing="-1">hp</text>
          </svg>
        </div>

        {/* LENOVO */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Lenovo">
          <div
            style={{
              backgroundColor: '#E2231A',
              color: '#ffffff',
              padding: '1px 5px',
              fontWeight: '800',
              fontSize: '10.5px',
              fontFamily: "'Arial Black', Arial, sans-serif",
              letterSpacing: '0.2px',
              borderRadius: '2px',
              lineHeight: '1.2'
            }}
          >
            Lenovo
          </div>
        </div>

        {/* APPLE */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px', gap: '3px' }} title="Apple">
          <svg viewBox="0 0 170 170" style={{ height: '13px', width: 'auto', display: 'block', fill: '#334155' }}>
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.96-14.43-5.77-8.91-10.37-18.9-13.8-29.98-3.44-11.07-5.16-21.73-5.16-31.98 0-14.34 3.7-26.37 11.1-36.08 7.4-9.71 16.71-14.65 27.93-14.83 5.43 0 11.39 1.48 17.88 4.43 6.48 2.95 10.45 4.49 11.9 4.6 2.01-.22 6.22-1.87 12.63-4.94 6.41-3.08 12.18-4.45 17.3-4.11 12.83.65 23.01 5.39 30.55 14.23-11.08 6.74-16.51 16.09-16.3 28.05.22 9.57 3.91 17.5 11.1 23.81 7.18 6.31 15.76 9.9 25.74 10.77-2.39 7.18-5.33 14.19-8.81 21.05zM119.22 33.62c0-7.18 2.61-13.91 7.83-20.2 5.22-6.28 11.64-10.22 19.26-11.83.65 2.18.98 4.46.98 6.85 0 7.18-2.72 13.91-8.15 20.2-5.43 6.28-11.85 10.22-19.26 11.83-.22-2.18-.66-4.46-.66-6.85z" />
          </svg>
          <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#334155', fontFamily: 'Arial, sans-serif' }}>Apple</span>
        </div>

        {/* ASUS */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Asus">
          <span
            style={{
              color: '#00539B',
              fontSize: '11.5px',
              fontWeight: '900',
              fontFamily: "'Arial Black', Arial, sans-serif",
              letterSpacing: '0.8px'
            }}
          >
            ASUS
          </span>
        </div>

        {/* ACER */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Acer">
          <span
            style={{
              color: '#83B81A',
              fontSize: '11.5px',
              fontWeight: '900',
              fontFamily: "'Arial Black', Arial, sans-serif",
              letterSpacing: '-0.2px'
            }}
          >
            acer
          </span>
        </div>

        {/* INTEL */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Intel">
          <div
            style={{
              color: '#0071C5',
              fontSize: '11px',
              fontWeight: '900',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.4px',
              border: '1.2px solid #0071C5',
              padding: '0 3.5px',
              borderRadius: '3px',
              lineHeight: '1.2'
            }}
          >
            intel.
          </div>
        </div>

        {/* AMD */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px', gap: '2px' }} title="AMD">
          <svg viewBox="0 0 24 24" style={{ height: '12px', width: '12px', display: 'block' }}>
            <path d="M0 0h11v11H0z" fill="#00875A" />
            <path d="M13 0h11v11H13z" fill="#ED1C24" />
            <path d="M13 13h11v11H13z" fill="#ED1C24" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: '900', color: '#111827', fontFamily: "'Arial Black', sans-serif" }}>AMD</span>
        </div>

        {/* SAMSUNG */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Samsung">
          <span
            style={{
              color: '#1428A0',
              fontSize: '10.5px',
              fontWeight: '900',
              fontFamily: "'Arial Black', Arial, sans-serif",
              letterSpacing: '0.8px'
            }}
          >
            SAMSUNG
          </span>
        </div>

        {/* WESTERN DIGITAL (WD) */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px', gap: '2.5px' }} title="Western Digital">
          <div
            style={{
              backgroundColor: '#005B94',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '9.5px',
              padding: '1px 3px',
              borderRadius: '2px',
              lineHeight: '1.2'
            }}
          >
            WD
          </div>
          <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#005B94', fontFamily: 'Arial, sans-serif' }}>Western Digital</span>
        </div>

        {/* SEAGATE */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px', gap: '2.5px' }} title="Seagate">
          <svg viewBox="0 0 20 20" style={{ height: '12px', width: '12px', display: 'block' }}>
            <circle cx="10" cy="10" r="9" fill="none" stroke="#74BB14" strokeWidth="2.5" />
            <path d="M6 10a4 4 0 0 1 8 0" fill="none" stroke="#74BB14" strokeWidth="2" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#1E293B', fontFamily: 'Arial, sans-serif' }}>SEAGATE</span>
        </div>

        {/* CISCO */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px', gap: '2.5px' }} title="Cisco">
          <svg viewBox="0 0 24 16" style={{ height: '10px', width: '14px', display: 'block', fill: '#1BA0D7' }}>
            <rect x="1" y="8" width="2" height="7" rx="1" />
            <rect x="5" y="4" width="2" height="11" rx="1" />
            <rect x="9" y="1" width="2" height="14" rx="1" />
            <rect x="13" y="1" width="2" height="14" rx="1" />
            <rect x="17" y="4" width="2" height="11" rx="1" />
            <rect x="21" y="8" width="2" height="7" rx="1" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: '900', color: '#1BA0D7', letterSpacing: '0.4px' }}>CISCO</span>
        </div>

        {/* TP-LINK */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="TP-Link">
          <span
            style={{
              color: '#00A2E8',
              fontSize: '10.5px',
              fontWeight: '800',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            tp-link
          </span>
        </div>

        {/* HIKVISION */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Hikvision">
          <span
            style={{
              color: '#E60012',
              fontSize: '10.5px',
              fontWeight: '900',
              fontFamily: "'Arial Black', Arial, sans-serif",
              letterSpacing: '0.2px'
            }}
          >
            HIKVISION
          </span>
        </div>

        {/* CP PLUS */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="CP Plus">
          <div
            style={{
              backgroundColor: '#E31E24',
              color: '#ffffff',
              padding: '1px 3.5px',
              fontWeight: '900',
              fontSize: '9px',
              fontFamily: 'Arial, sans-serif',
              borderRadius: '2px',
              lineHeight: '1.2'
            }}
          >
            CP PLUS
          </div>
        </div>

        {/* CANON */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Canon">
          <span
            style={{
              color: '#CC0000',
              fontSize: '10.5px',
              fontWeight: '900',
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: '0.3px'
            }}
          >
            Canon
          </span>
        </div>

        {/* EPSON */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Epson">
          <span
            style={{
              color: '#003399',
              fontSize: '10.5px',
              fontWeight: '900',
              fontFamily: "'Arial Black', sans-serif",
              letterSpacing: '0.4px'
            }}
          >
            EPSON
          </span>
        </div>

        {/* BROTHER */}
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }} title="Brother">
          <span
            style={{
              color: '#2B2D42',
              fontSize: '10.5px',
              fontWeight: '900',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.3px'
            }}
          >
            brother
          </span>
        </div>
      </div>
    </div>
  );
};

export default HardwareBrandsBanner;