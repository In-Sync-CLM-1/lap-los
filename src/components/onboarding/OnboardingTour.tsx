import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';
import { WelcomeModal } from './WelcomeModal';
import { CompletionModal } from './CompletionModal';

export function OnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isOnboardingActive,
    currentStep,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    endTour,
  } = useOnboarding();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // Find target element when step changes
  const findTargetElement = useCallback(() => {
    if (!currentStep) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(`[data-tour="${currentStep.target}"]`) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
      setTargetElement(null);
    }
  }, [currentStep]);

  // Navigate to correct route for step
  useEffect(() => {
    if (!isOnboardingActive || !currentStep) return;

    if (currentStep.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isOnboardingActive, currentStep, location.pathname, navigate]);

  // Find target after navigation or step change
  useEffect(() => {
    if (!isOnboardingActive) {
      setTargetElement(null);
      return;
    }

    // Wait for DOM to update after navigation
    const timer = setTimeout(findTargetElement, 300);
    return () => clearTimeout(timer);
  }, [isOnboardingActive, currentStep, location.pathname, findTargetElement]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOnboardingActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingActive, nextStep, prevStep, endTour]);

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal />
      
      {/* Completion Modal */}
      <CompletionModal />

      {/* Active Tour Components */}
      {isOnboardingActive && currentStep && (
        <>
          <TourSpotlight targetElement={targetElement} isActive={isOnboardingActive} />
          <TourTooltip
            step={currentStep}
            targetElement={targetElement}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={endTour}
            isFirst={currentStepIndex === 0}
            isLast={currentStepIndex === steps.length - 1}
          />
        </>
      )}
    </>
  );
}
