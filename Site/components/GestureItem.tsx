import React from 'react';
import { Gesture } from '../data/gestures';

const BASE = import.meta.env.BASE_URL;

interface Props {
  gesture: Gesture;
  index?: number;
}

const GestureItem: React.FC<Props> = ({ gesture, index = 0 }) => (
  <div
    className="reveal-fade flex items-start gap-4 py-4 border-b border-brand-surface last:border-0"
    style={{ transitionDelay: `${index * 70}ms` }}
  >
    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brand-blue/8 flex items-center justify-center">
      <img
        src={`${BASE}illustrations/icons/${gesture.icon}`}
        alt=""
        aria-hidden="true"
        className="w-7 h-7 object-contain"
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h4 className="font-heading font-600 text-sm text-slate-900 leading-snug">
          {gesture.title}
        </h4>
        {gesture.economy && (
          <span className="font-heading font-700 text-base text-brand-blue">
            {gesture.economy}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 font-body leading-relaxed">
        {gesture.description}
      </p>
    </div>
  </div>
);

export default GestureItem;
