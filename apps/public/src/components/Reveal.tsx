import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades/slides a section into view the first time it crosses into the
 * viewport. Cheap (one shared observer per instance, unobserves after
 * firing) and respects prefers-reduced-motion via the CSS side (see
 * .reveal in brand.css).
 */
export type RevealVariant = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom' | 'none';

export function Reveal({
  children,
  delay = 0,
  className = '',
  variant = 'fade-up',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: RevealVariant | string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effectiveVariant = variant && variant !== 'fade-up' ? ` reveal-${variant}` : '';

  return (
    <div
      ref={ref}
      className={`reveal${effectiveVariant}${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
