import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
}) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300 ${
                    idx <= currentStepIndex ? 'bg-[#5B4DFF]' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                />
              )}
              <div
                onClick={() => onStepClick && idx < currentStepIndex && onStepClick(idx)}
                className={`flex items-center gap-3 cursor-pointer group ${
                  onStepClick && idx < currentStepIndex ? 'hover:opacity-80' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shrink-0 ${
                    isCompleted
                      ? 'bg-[#5B4DFF] text-white shadow-md shadow-[#5B4DFF]/20'
                      : isCurrent
                      ? 'bg-[#5B4DFF] text-white ring-4 ring-[#5B4DFF]/20 scale-105'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <div className="hidden md:block">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-[#5B4DFF]' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-[10px] text-gray-400 font-normal">{step.description}</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
