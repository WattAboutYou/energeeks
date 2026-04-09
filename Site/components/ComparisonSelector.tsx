
import React from 'react';
import { ComparisonBase } from '../types';

interface ComparisonSelectorProps {
  activeBase: ComparisonBase;
  onChange: (base: ComparisonBase) => void;
}

const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({ activeBase, onChange }) => {
  const options = [
    { 
      id: ComparisonBase.SIMILAR, 
      label: 'Foyers Similaires', 
      desc: 'Même DPE et zone géo',
      icon: '🏠' 
    },
    { 
      id: ComparisonBase.EFFICIENT, 
      label: 'Performance A-B', 
      desc: 'L\'objectif à atteindre',
      icon: '✨' 
    },
    { 
      id: ComparisonBase.TERRITORIAL, 
      label: 'Moyenne Locale', 
      desc: 'Tout le département',
      icon: '📍' 
    }
  ];

  return (
    <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-2 mb-6">
      <div className="flex items-center px-4 py-2 border-r border-gray-100 mr-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Comparer à :</span>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
              activeBase === opt.id 
                ? 'bg-enedis-bright/5 border-enedis-bright shadow-inner' 
                : 'bg-white border-gray-100 hover:border-enedis-blue/30 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{opt.icon}</span>
              <span className={`text-sm font-bold ${activeBase === opt.id ? 'text-enedis-bright' : 'text-slate-700'}`}>
                {opt.label}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ComparisonSelector;
