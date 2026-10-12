import React, { useState } from 'react';
import { 
  FileEdit, 
  ShieldCheck, 
  Coins, 
  RefreshCw, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { WORKFLOW_STEPS } from '../../assets/mockData';

export const ConceptWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const getStepIcon = (name: string) => {
    switch (name) {
      case 'FileEdit':
        return <FileEdit className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Coins':
        return <Coins className="w-5 h-5" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  const currentStepData = WORKFLOW_STEPS.find(s => s.stepNumber === activeStep) || WORKFLOW_STEPS[0];

  return (
    <div className="py-6 sm:py-10">
      {/* Workflow Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Peer-to-Peer Micro-Lending Process
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          The verified 5-stage lifecycle connecting Indian borrowers directly with everyday community lenders.
        </p>
      </div>

      {/* 5-Step Process Timeline Bar */}
      <div className="relative mb-10 hidden lg:block">
        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
        
        <div className="grid grid-cols-5 gap-3 relative z-10">
          {WORKFLOW_STEPS.map((step) => {
            const isSelected = activeStep === step.stepNumber;
            const isPast = activeStep > step.stepNumber;

            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStep(step.stepNumber)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20 scale-[1.02]'
                    : isPast
                    ? 'bg-white/90 border-emerald-300 text-slate-700 hover:bg-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.actor === 'Borrower'
                        ? 'bg-blue-50 text-blue-700'
                        : step.actor === 'Lender'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {step.actor}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1 line-clamp-1">
                  {step.title}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {step.timelineLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Process Flow Cards (Mobile / Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {WORKFLOW_STEPS.map((step) => {
          const isSelected = activeStep === step.stepNumber;
          return (
            <div
              key={step.stepNumber}
              onClick={() => setActiveStep(step.stepNumber)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 card-hover-effect flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-blue-500 shadow-soft-lg ring-1 ring-blue-500'
                  : 'bg-white border-slate-200/80 shadow-soft-sm hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      step.actor === 'Borrower'
                        ? 'bg-blue-50 text-blue-600'
                        : step.actor === 'Lender'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {getStepIcon(step.iconName)}
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    0{step.stepNumber}
                  </span>
                </div>

                <div className="mb-2">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      step.actor === 'Borrower'
                        ? 'bg-blue-100/70 text-blue-800'
                        : step.actor === 'Lender'
                        ? 'bg-emerald-100/70 text-emerald-800'
                        : 'bg-slate-200/80 text-slate-800'
                    }`}
                  >
                    {step.actor}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>{step.timelineLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Spotlight Box */}
      <div className="mt-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            {getStepIcon(currentStepData.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Stage Spotlight • Step {currentStepData.stepNumber} of 5
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {currentStepData.actor}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              {currentStepData.title}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {currentStepData.description}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <button
            onClick={() => setActiveStep((prev) => (prev > 1 ? prev - 1 : 5))}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setActiveStep((prev) => (prev < 5 ? prev + 1 : 1))}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
          >
            Next
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
