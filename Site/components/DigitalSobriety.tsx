import React, { useState } from 'react';
import { DIGITAL_THEMES, DigitalTheme } from '../data/gestures';

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    aria-hidden="true"
  >
    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThemePanel: React.FC<{ theme: DigitalTheme; defaultOpen?: boolean }> = ({
  theme,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-brand-surface rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
        aria-expanded={open}
      >
        <span className="font-heading font-600 text-sm text-slate-900">{theme.title}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="bg-white border-t border-brand-surface divide-y divide-brand-surface">
          {theme.gestures.map((g) => (
            <div key={g.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                {g.stat && (
                  <div className="flex-shrink-0 text-center min-w-[56px]">
                    <span className="block font-heading font-700 text-base text-brand-blue leading-tight">
                      {g.stat}
                    </span>
                    {g.statLabel && (
                      <span className="block text-[10px] text-slate-400 font-body leading-tight mt-0.5">
                        {g.statLabel}
                      </span>
                    )}
                  </div>
                )}
                <div className={g.stat ? 'border-l border-brand-surface pl-3 flex-1' : 'flex-1'}>
                  <p className="font-heading font-600 text-xs text-slate-800 mb-1">{g.title}</p>
                  <p className="text-xs text-slate-500 font-body leading-relaxed">
                    {g.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DigitalSobriety: React.FC = () => (
  <div className="reveal-fade flex flex-col gap-3">
    {DIGITAL_THEMES.map((theme, i) => (
      <ThemePanel key={theme.id} theme={theme} defaultOpen={i === 0} />
    ))}
    <p className="text-[11px] text-slate-400 font-body text-right pt-1">
      Source : ADEME — Comment adopter la sobriété numérique ? (2025)
    </p>
  </div>
);

export default DigitalSobriety;
