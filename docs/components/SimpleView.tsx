
import React, { useState } from 'react';
import { ComparisonMetrics, AddressData, DPEGroup } from '../types';
import AdviceSection from './AdviceSection';
import HousingMap from './HousingMap';

interface SimpleViewProps {
  metrics: ComparisonMetrics;
  userAddress?: AddressData;
}

const SimpleView: React.FC<SimpleViewProps> = ({ metrics, userAddress }) => {
  const [activeInfo, setActiveInfo] = useState<'diagnostic' | 'carbon' | null>(null);
  const diff = Math.round(metrics.differencePercentage);
  const betterThan = Math.round(metrics.betterThanPercentage);

  let statusColor = 'text-enedis-green';
  let bgColor = 'bg-enedis-green/5';
  let message = "Excellente performance énergétique !";
  
  if (diff > 25) {
    statusColor = 'text-red-700';
    bgColor = 'bg-red-100';
    message = "Votre consommation est nettement supérieure au profil type.";
  } else if (diff > 10) {
    statusColor = 'text-red-600';
    bgColor = 'bg-red-50';
    message = "Consommation supérieure à la moyenne du groupe.";
  } else if (diff > -5) {
    statusColor = 'text-yellow-600';
    bgColor = 'bg-yellow-50';
    message = "Consommation dans la norme du groupe.";
  } else if (diff > -20) {
    statusColor = 'text-enedis-green';
    bgColor = 'bg-enedis-green/5';
    message = "Bonne maîtrise de vos consommations.";
  }

  // Positioning Gauge Calculations
  const median = metrics.groupMedian;
  const maxRange = median * 2;
  const userPos = Math.min(100, Math.max(0, (metrics.userConsumption / maxRange) * 100));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Side-by-Side Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Diagnostic Flash Section */}
        <div 
          onClick={() => setActiveInfo(activeInfo === 'diagnostic' ? null : 'diagnostic')}
          className={`flex flex-col p-8 rounded-3xl border ${activeInfo === 'diagnostic' ? 'border-enedis-bright ring-4 ring-enedis-bright/5' : 'border-slate-100'} ${bgColor} text-center shadow-lg shadow-slate-200/20 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden`}
        >
          <div className="absolute top-5 right-5 text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-enedis-bright transition-colors">
            {activeInfo === 'diagnostic' ? 'Fermer ✕' : 'Comprendre ce chiffre ℹ️'}
          </div>
          
          <h2 className="text-[11px] font-black text-enedis-title uppercase tracking-[0.2em] mb-4">Diagnostic Flash</h2>
          <div className="flex flex-col items-center justify-center my-4">
            <span className="text-6xl font-black text-slate-800 tracking-tighter">
              {betterThan}%
            </span>
            <span className="text-[11px] text-slate-500 font-bold mt-3 max-w-[220px]">
              Vous consommez <span className="text-enedis-blue border-b border-enedis-blue/20">moins que {betterThan}%</span> des logements similaires
            </span>
          </div>
          <p className={`text-sm font-black ${statusColor} mt-4`}>{message}</p>

          {activeInfo === 'diagnostic' && (
            <div className="mt-6 p-6 bg-white rounded-2xl border border-enedis-bright/10 text-left animate-fade-in shadow-inner">
              <h4 className="text-[10px] font-black uppercase text-enedis-bright mb-2">C'est quoi ce pourcentage ?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Ce chiffre représente votre classement parmi <strong>{metrics.totalSimilarHouseholds} foyers</strong> identiques. 
                <br /><br />
                Si vous affichez <strong>80%</strong>, cela signifie que vous faites partie des 20% les plus économes : votre facture est inférieure à celle de 80% de vos voisins.
              </p>
            </div>
          )}
        </div>

        {/* Carbon Impact Section */}
        <div 
          onClick={() => setActiveInfo(activeInfo === 'carbon' ? null : 'carbon')}
          className={`flex flex-col p-8 rounded-3xl border ${activeInfo === 'carbon' ? 'border-enedis-green ring-4 ring-enedis-green/5' : 'border-slate-100'} bg-white text-center shadow-lg shadow-slate-200/20 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden`}
        >
          <div className="absolute top-5 right-5 text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-enedis-green transition-colors">
            {activeInfo === 'carbon' ? 'Fermer ✕' : 'Méthode ℹ️'}
          </div>
          
          <h2 className="text-[11px] font-black text-enedis-green uppercase tracking-[0.2em] mb-4">Impact Environnemental</h2>
          
          <div className="flex flex-col items-center justify-center my-4">
            <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">{metrics.co2Tons.toFixed(2)}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">tCO₂/an</span>
            </div>
            
            <div className="w-12 h-px bg-slate-100 my-4"></div>

            <div className="text-center px-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">🌳</span>
                <span className="text-3xl font-black text-enedis-green">{metrics.treesEquivalent}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                {metrics.treesEquivalent} arbres nécessaires pour compenser votre empreinte annuelle
              </p>
            </div>
          </div>

          {activeInfo === 'carbon' && (
            <div className="mt-6 p-6 bg-enedis-green/5 rounded-2xl border border-enedis-green/10 text-left animate-fade-in shadow-inner">
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Calculé sur la base de <strong>60g CO₂ / kWh</strong> (mix français - <strong>SOURCE ADEME</strong>) et une capacité d'absorption de <strong>25kg/an</strong> par arbre.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Positionnement Widget (Gauge) */}
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/20">
        <h2 className="text-sm font-black text-enedis-title uppercase tracking-[0.2em] mb-12">Positionnement</h2>
        
        <div className="relative pt-12 pb-16 px-4">
          <div className="absolute top-4 left-0 text-[11px] font-bold text-slate-400">0 kWh</div>
          <div className="absolute top-4 right-0 text-[11px] font-bold text-slate-400">{maxRange.toLocaleString()} kWh</div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-[11px] font-black text-slate-600 mb-1">Médiane ({median.toLocaleString()} kWh)</span>
            <div className="h-20 w-px border-l-2 border-dashed border-slate-400"></div>
          </div>

          <div className="h-3 w-full rounded-full bg-gradient-to-r from-enedis-green via-yellow-400 to-red-500 shadow-inner"></div>

          <div 
            className="absolute top-[4.2rem] flex flex-col items-center transition-all duration-1000 ease-out"
            style={{ left: `${userPos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-3 h-3 bg-enedis-bright rounded-full border-2 border-white shadow-md mb-2"></div>
            <div className="bg-enedis-bright text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-enedis-bright/20 whitespace-nowrap">
              Vous ({metrics.userConsumption.toLocaleString()} kWh)
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
          Source : Base de données DPE ADEME (2024), traitée par Energeeks.
        </p>
      </div>

      {/* Cluster Characteristics Replacement */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/20">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="text-lg">📋</span> Votre Cluster de comparaison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.clusterCharacteristics.map((char, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50 hover:bg-white transition-colors group">
              <span className="w-1.5 h-1.5 rounded-full bg-enedis-bright/40 group-hover:bg-enedis-bright transition-colors"></span>
              <span className="text-[11px] font-bold text-slate-600 leading-tight">{char}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[10px] text-slate-400 italic font-medium leading-relaxed">
          * Ces caractéristiques définissent le groupe de <strong>{metrics.totalSimilarHouseholds} logements</strong> auxquels vous êtes comparé pour garantir un résultat pertinent.
        </p>
      </div>

      <HousingMap userAddress={userAddress} />
      <AdviceSection dpe={metrics.dpeGroup} differencePercentage={metrics.differencePercentage} />
    </div>
  );
};

export default SimpleView;
