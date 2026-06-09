import React from 'react';
import { NEXT_STEPS, NextStep } from '../data/gestures';
import { DPEGroup } from '../types';

interface Props {
  dpe?: DPEGroup;
}

const ExternalIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    className="w-3.5 h-3.5 inline-block ml-1 opacity-60"
    aria-hidden="true"
  >
    <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
    <path d="M9 2h5v5M14 2 8 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StepCard: React.FC<{ step: NextStep; index: number }> = ({ step, index }) => (
  <div
    className="reveal-fade bg-white rounded-2xl p-5 border border-brand-surface shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
    style={{ transitionDelay: `${index * 80}ms` }}
  >
    <h4 className="font-heading font-600 text-sm text-slate-900 leading-snug">{step.title}</h4>
    <p className="text-xs text-slate-500 font-body leading-relaxed flex-1">{step.description}</p>
    <a
      href={step.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-xs font-heading font-600 text-brand-accent hover:text-brand-blue transition-colors mt-auto"
    >
      {step.cta}
      <ExternalIcon />
    </a>
  </div>
);

const NextStepsBlock: React.FC<Props> = ({ dpe }) => {
  const steps = NEXT_STEPS.filter(
    (s) => !s.dpeFilter || (dpe && s.dpeFilter.includes(dpe))
  );

  return (
    <div className="reveal-fade grid grid-cols-1 sm:grid-cols-3 gap-4">
      {steps.map((step, i) => (
        <StepCard key={step.id} step={step} index={i} />
      ))}
    </div>
  );
};

export default NextStepsBlock;
