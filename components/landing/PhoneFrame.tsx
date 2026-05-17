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
        width: 360,
        height: 720,
        background: '#0A0A14',
        borderRadius: 48,
        padding: 14,
        boxShadow:
          '0 30px 60px -20px rgba(45,106,79,0.25), 0 20px 40px -10px rgba(0,0,0,0.18)',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 110,
          height: 28,
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
          borderRadius: 36,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}
