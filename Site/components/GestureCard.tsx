import React from 'react';
import { Gesture } from '../data/gestures';

const BASE = import.meta.env.BASE_URL;

interface Props {
  gesture: Gesture;
  index?: number;
}

const impactColors: Record<string, string> = {
  fort: 'bg-brand-green/10 text-green-700',
  significant: 'bg-brand-yellow/20 text-yellow-800',
  modere: 'bg-slate-100 text-slate-600',
};

const impactLabels: Record<string, string> = {
  fort: 'Fort impact',
  significant: 'Bon impact',
  modere: 'Impact modéré',
};

const GestureCard: React.FC<Props> = ({ gesture, index = 0 }) => (
  <div
    className="reveal-fade bg-white rounded-2xl p-5 border border-brand-surface shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3"
    style={{ transitionDelay: `${index * 60}ms` }}
  >
    <div className="flex items-start justify-between gap-2">
      <img
        src={`${BASE}illustrations/icons/${gesture.icon}`}
        alt=""
        aria-hidden="true"
        className="w-9 h-9 object-contain flex-shrink-0 mt-0.5"
      />
      <span
        className={`text-xs font-heading font-600 px-2 py-0.5 rounded-full whitespace-nowrap ${impactColors[gesture.impact] ?? impactColors.modere}`}
      >
        {impactLabels[gesture.impact]}
      </span>
    </div>

    <div className="flex-1">
      <h4 className="font-heading font-600 text-sm text-slate-900 mb-1 leading-snug">
        {gesture.title}
      </h4>
      <p className="text-xs text-slate-500 font-body leading-relaxed">
        {gesture.description}
      </p>
    </div>

    {gesture.economy && (
      <div className="flex items-baseline gap-1.5 pt-2 border-t border-brand-surface">
        <span className="font-heading font-700 text-lg text-brand-blue leading-none">
          {gesture.economy}
        </span>
        {gesture.economyLabel && (
          <span className="text-xs text-slate-500 font-body">{gesture.economyLabel}</span>
        )}
      </div>
    )}
  </div>
);

export default GestureCard;
