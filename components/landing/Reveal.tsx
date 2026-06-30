'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Wraps content in a scroll-reveal (fade + 8px rise) that triggers once as it
 * enters the viewport. Honours prefers-reduced-motion via the `.reveal` CSS
 * (reduced-motion users see content immediately, fully visible).
 */
export function Reveal({
  children,
  as,
  className = '',
  delay = 0,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  [key: string]: unknown;
}) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If IntersectionObserver isn't available, just show the content.
    // Defer the state update so it doesn't run synchronously inside the effect.
    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
