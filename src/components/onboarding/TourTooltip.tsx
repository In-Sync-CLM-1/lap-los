import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TourStep } from '@/lib/tour-steps';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourTooltipProps {
  step: TourStep;
  targetElement: HTMLElement | null;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

type Position = {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
};

export function TourTooltip({
  step,
  targetElement,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
}: TourTooltipProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetElement) {
      setPosition(null);
      return;
    }

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
      const padding = 16;
      const arrowOffset = 12;

      let top = 0;
      let left = 0;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = step.placement;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      switch (step.placement) {
        case 'bottom':
          top = rect.bottom + arrowOffset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          // Check if tooltip goes off bottom
          if (top + tooltipHeight > viewportHeight - padding) {
            top = rect.top - tooltipHeight - arrowOffset;
            arrowPosition = 'bottom';
          }
          break;
        case 'top':
          top = rect.top - tooltipHeight - arrowOffset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          // Check if tooltip goes off top
          if (top < padding) {
            top = rect.bottom + arrowOffset;
            arrowPosition = 'top';
          }
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + arrowOffset;
          // Check if tooltip goes off right
          if (left + tooltipWidth > viewportWidth - padding) {
            left = rect.left - tooltipWidth - arrowOffset;
            arrowPosition = 'right';
          }
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - arrowOffset;
          // Check if tooltip goes off left
          if (left < padding) {
            left = rect.right + arrowOffset;
            arrowPosition = 'left';
          }
          break;
      }

      // Constrain to viewport
      left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

      setPosition({ top, left, arrowPosition });
    };

    calculatePosition();

    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [targetElement, step.placement]);

  if (!position || !targetElement) return null;

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[9999] w-80 bg-popover border border-border rounded-lg shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{ top: position.top, left: position.left }}
    >
      {/* Arrow */}
      <div
        className={cn(
          "absolute w-3 h-3 bg-popover border-border rotate-45",
          position.arrowPosition === 'top' && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t",
          position.arrowPosition === 'bottom' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b",
          position.arrowPosition === 'left' && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b",
          position.arrowPosition === 'right' && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t"
        )}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-foreground">{step.title}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {step.description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button size="sm" onClick={onNext} className="gap-1">
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
