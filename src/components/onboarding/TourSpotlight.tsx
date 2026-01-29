import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TourSpotlightProps {
  targetElement: HTMLElement | null;
  isActive: boolean;
}

export function TourSpotlight({ targetElement, isActive }: TourSpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetElement || !isActive) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const newRect = targetElement.getBoundingClientRect();
      setRect(newRect);
    };

    updateRect();

    // Update position on scroll and resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetElement, isActive]);

  if (!isActive || !rect) return null;

  const padding = 8;

  return createPortal(
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
        />
      </svg>
      
      {/* Highlight border */}
      <div
        className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_4px_rgba(var(--primary),0.2)] transition-all duration-300"
        style={{
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      />
    </div>,
    document.body
  );
}
