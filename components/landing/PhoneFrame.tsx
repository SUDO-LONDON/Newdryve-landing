import type { CSSProperties, ReactNode } from 'react';

export function PhoneFrame({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 360,
        aspectRatio: '360 / 720',
        background: '#0A0A14',
        borderRadius: 'clamp(36px, 13.3%, 48px)',
        padding: 'clamp(10px, 3.9%, 14px)',
        boxShadow:
          '0 30px 60px -20px rgba(45,106,79,0.25), 0 20px 40px -10px rgba(0,0,0,0.18)',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2.8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30.5%',
          height: '3.9%',
          background: '#0A0A14',
          borderRadius: 999,
          zIndex: 10,
        }}
        aria-hidden="true"
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#F0EDF0',
          borderRadius: 'clamp(28px, 10%, 36px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}
