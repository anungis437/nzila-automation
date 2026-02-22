/**
 * Wizard Stepper Component
 * 
 * Multi-step form wizard with:
 * - Step navigation
 * - Progress indicator
 * - Validation per step
 * - Back/Next/Submit actions
 * - Optional step skipping
 * - Responsive design
 * - Accessibility
 * 
 * @module components/ui/wizard-stepper
 */

"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  component: React.ReactNode;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onStepChange?: (stepIndex: number) => void;
  onValidateStep?: (stepIndex: number) => boolean | Promise<boolean>;
  currentStep?: number;
  showStepNumbers?: boolean;
  allowStepNavigation?: boolean;
  className?: string;
}

export function WizardStepper({
  steps,
  onComplete,
  onStepChange,
  onValidateStep,
  currentStep = 0,
  showStepNumbers = true,
  allowStepNavigation = false,
  className,
}: WizardStepperProps) {
  const [activeStep, setActiveStep] = React.useState(currentStep);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);

  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  const handleNext = async () => {
    setIsValidating(true);

    // Validate current step
    if (onValidateStep) {
      const isValid = await onValidateStep(activeStep);
      if (!isValid) {
        setIsValidating(false);
        return;
      }
    }

    setIsValidating(false);

    // Mark step as completed
    setCompletedSteps((prev) => new Set(prev).add(activeStep));

    if (isLastStep) {
      await onComplete();
    } else {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = activeStep - 1;
      setActiveStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (allowStepNavigation || completedSteps.has(stepIndex)) {
      setActiveStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isActive = index === activeStep;
            const isClickable = allowStepNavigation || isCompleted;

            return (
              <React.Fragment key={step.id}>
                {/* Step */}
                <div
                  className={cn(
                    "flex flex-col items-center",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && handleStepClick(index)}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                      isCompleted && "bg-green-600 border-green-600",
                      isActive && !isCompleted && "border-blue-600 bg-blue-50",
                      !isActive && !isCompleted && "border-gray-300 bg-white"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : showStepNumbers ? (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-blue-600" : "text-gray-500"
                        )}
                      >
                        {index + 1}
                      </span>
                    ) : null}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-blue-600",
                        !isActive && "text-gray-700"
                      )}
                    >
                      {step.title}
                    </div>
                    {step.optional && (
                      <div className="text-xs text-gray-500 mt-1">Optional</div>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors",
                      isCompleted ? "bg-green-600" : "bg-gray-300"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border p-6">
          {steps[activeStep].description && (
            <p className="text-sm text-gray-600 mb-6">
              {steps[activeStep].description}
            </p>
          )}
          {steps[activeStep].component}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || isValidating}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-sm text-gray-600">
          Step {activeStep + 1} of {steps.length}
        </div>

        <Button onClick={handleNext} disabled={isValidating}>
          {isValidating ? (
            "Validating..."
          ) : isLastStep ? (
            "Complete"
          ) : (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

