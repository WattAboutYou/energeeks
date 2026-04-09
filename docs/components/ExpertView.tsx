
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label
} from 'recharts';
import { ComparisonMetrics, AddressData, DistributionBin } from '../types';
import { getBottom90Distribution } from '../services/dataService';
import AdviceSection from './AdviceSection';
import HousingMap from './HousingMap';
import SimilarHousingInfo from './SimilarHousingInfo';

interface ExpertViewProps {
  metrics: ComparisonMetrics;
  userAddress?: AddressData;
  onOpenDashboard?: () => void;
}

type TabType = 'distribution' | 'dpe';

const ExpertView: React.FC<ExpertViewProps> = ({ metrics, userAddress, onOpenDashboard }) => {
  const [activeTab, setActiveTab] = useState<TabType>('distribution');
  const [activeStatInfo, setActiveStatInfo] = useState<string | null>(null);
  const [bottom90Data, setBottom90Data] = useState<DistributionBin[] | null>(null);
  const [showBottom90, setShowBottom90] = useState<boolean>(false);
  const [userNotInBottom90, setUserNotInBottom90] = useState<boolean>(false);

  const tabs = [
    { id: 'distribution', label: 'Distribution', icon: '📊' },
    { id: 'dpe', label: 'Parc Local', icon: '🏠' },
  ];

  const statHelp: Record<string, { title: string, desc: string }> = {
    'Moyenne': {
      title: 'Moyenne Arithmétique',
      desc: 'Somme de toutes les consommations divisée par le nombre de foyers. Elle donne une vision globale mais peut être influencée par des valeurs extrêmes.'
    },
    'Médiane': {
      title: 'Valeur Médiane',
      desc: 'Le point central de l\'échantillon : 50% des foyers consomment moins que cette valeur, et 50% consomment plus. C\'est l\'indicateur le plus robuste.'
    },
    'Percentile': {
      title: 'Rang Percentile',
      desc: 'Votre position sur une échelle de 0 à 100. Un percentile de 4 signifie que seuls 4% des foyers sont plus économes que vous. Plus le chiffre est bas, mieux c\'est.'
    },
    'Échantillon': {
      title: 'Taille de la Cohorte',
      desc: 'Nombre total de logements réels dans la base ADEME présentant des caractéristiques (DPE, Surface, Localisation) similaires aux vôtres.'
    }
  };

  const sortedDpeData = useMemo(() => {
    return [...metrics.dpeDistribution].sort((a, b) => a.class.localeCompare(b.class));
  }, [metrics.dpeDistribution]);

  const userBinValue = useMemo(() => {
    return metrics.distribution.find(d => d.isUserBin)?.rangeStart;
  }, [metrics.distribution]);

  const expertInterpretation = useMemo(() => {
    const diff = Math.round(metrics.differencePercentage);
    const isEfficient = diff <= 0;
    
    const interpretations = {
      distribution: isEfficient 
        ? `Diagnostic : Votre consommation de ${metrics.userConsumption.toLocaleString()} kWh vous positionne favorablement dans le premier quartile. Votre sobriété d'usage compense les caractéristiques intrinsèques de votre DPE ${metrics.dpeGroup}.`
        : `Analyse : Votre consommation est à droite de la médiane. Votre profil suggère un potentiel d'optimisation important.`,
      dpe: `Le parc local est présenté par ordre alphabétique (A-G). Votre logement est classé ${metrics.dpeGroup}.`,
    };
    
    return interpretations[activeTab];
  }, [activeTab, metrics]);

  const renderStatCard = (label: string, value: string, sub: string, highlight: boolean = false) => {
    const isActive = activeStatInfo === label;
    return (
      <div className="relative">
        <div 
          onClick={() => setActiveStatInfo(isActive ? null : label)}
          className={`bg-white p-6 rounded-xl border shadow-sm cursor-pointer transition-all hover:border-enedis-bright group ${isActive ? 'border-enedis-bright ring-2 ring-enedis-bright/5' : 'border-slate-100'}`}
        >
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
            {label}
            <span className={`text-[10px] transition-opacity ${isActive ? 'opacity-100 text-enedis-bright' : 'opacity-0 group-hover:opacity-100'}`}>Info ℹ️</span>
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-black ${highlight ? 'text-enedis-bright' : 'text-slate-800'}`}>{value}</p>
            <p className="text-sm font-bold text-slate-400">{sub}</p>
          </div>
        </div>
        
        {isActive && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-slate-800 text-white rounded-lg shadow-2xl animate-fade-in border border-slate-700">
            <h5 className="text-[10px] font-bold uppercase text-enedis-green mb-1">{statHelp[label].title}</h5>
            <p className="text-[11px] leading-relaxed opacity-90">{statHelp[label].desc}</p>
          </div>
        )}
      </div>
    );
  };

  const handleBarClick = (chartData: DistributionBin[], data: any) => {
    if (!data || !metrics.clusterCharacteristics) return;
    
    // Use activeTooltipIndex to reliably find the clicked bin
    const index = data.activeTooltipIndex;
    if (index === undefined || index === null || !chartData[index]) return;
    const bin = chartData[index];
    
    // Only trigger on the user's bin
    if (!bin.isUserBin) return;
    
    // Extract cluster label from characteristics
    const clusterLine = metrics.clusterCharacteristics.find(c => c.startsWith('Cluster :'));
    const clusterLabel = clusterLine ? clusterLine.replace('Cluster : ', '') : '';
    if (!clusterLabel) return;

    const result = getBottom90Distribution(clusterLabel, metrics.userConsumption);
    if (result === null) {
      // User is NOT in the bottom 90%
      setUserNotInBottom90(true);
      setTimeout(() => setUserNotInBottom90(false), 4000);
      return;
    }
    setBottom90Data(result);
    setShowBottom90(true);
  };

  const handleBackToMainHistogram = () => {
    setBottom90Data(null);
    setShowBottom90(false);
  };

  const renderChart = () => {
    const commonMargin = { top: 20, right: 30, left: 10, bottom: 40 };

    switch (activeTab) {
      case 'distribution':
        const chartData = showBottom90 && bottom90Data ? bottom90Data : metrics.distribution;
        const bottom90UserValue = bottom90Data?.find(d => d.isUserBin)?.rangeStart;
        return (
          <div>
            {showBottom90 && bottom90Data && (
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={handleBackToMainHistogram}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-enedis-bright hover:text-enedis-blue border border-enedis-bright/30 rounded-xl hover:bg-enedis-bright/5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  Retour à la vue globale
                </button>
                <span className="text-sm font-bold text-slate-500">
                  🔍 Vue recentrée : 75% des logements les moins consommateurs
                </span>
              </div>
            )}
            {userNotInBottom90 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center animate-fade-in">
                <p className="text-sm font-bold text-amber-700">⚠️ Votre logement ne fait pas partie des 75% les moins consommateurs de ce cluster.</p>
              </div>
            )}
            {!showBottom90 && !userNotInBottom90 && (
              <p className="text-[10px] text-slate-400 font-bold mb-4 text-center">💡 Cliquez sur votre tranche (en bleu) pour voir la répartition des 75% les moins consommateurs</p>
            )}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={commonMargin} barCategoryGap="15%" onClick={!showBottom90 ? (data: any) => handleBarClick(chartData, data) : undefined} style={!showBottom90 ? { cursor: 'pointer' } : undefined}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="rangeStart" 
                    tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} 
                    tick={{fontSize: 12, fill: '#64748b'}}
                    height={50}
                  >
                    <Label value="Consommation (kWh)" offset={-10} position="insideBottom" fill="#64748b" fontSize={12} fontWeight="bold" />
                  </XAxis>
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} width={40}>
                     <Label value="Nombre de foyers" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#64748b" fontSize={12} fontWeight="bold" />
                  </YAxis>
                  <Tooltip 
                    cursor={{fill: 'rgba(0, 0, 0, 0.06)'}}
                    labelFormatter={(value) => {
                      const bin = chartData.find(d => d.rangeStart === value);
                      if (bin) {
                        return `Tranche : ${bin.rangeStart.toLocaleString()} - ${bin.rangeEnd.toLocaleString()} kWh`;
                      }
                      return value;
                    }}
                    formatter={(value) => [value, 'Nombre de foyers']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '11px', fontWeight: '900', color: '#1423DC', marginBottom: '4px', textTransform: 'uppercase' }}
                  />
                  
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.isUserBin ? '#1423DC' : (showBottom90 ? '#6366f1' : '#cbd5e1')} style={!showBottom90 && entry.isUserBin ? { cursor: 'pointer' } : undefined} />
                     ))}
                  </Bar>
                  
                  {!showBottom90 && userBinValue && (
                    <ReferenceLine x={userBinValue} stroke="#1423DC" strokeWidth={4}>
                      <Label value="VOUS" position="top" fill="#1423DC" fontSize={11} fontWeight="900" dy={-15} />
                    </ReferenceLine>
                  )}
                  {showBottom90 && bottom90UserValue !== undefined && (
                    <ReferenceLine x={bottom90UserValue} stroke="#1423DC" strokeWidth={4}>
                      <Label value="VOUS" position="top" fill="#1423DC" fontSize={11} fontWeight="900" dy={-15} />
                    </ReferenceLine>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'dpe':
        return (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedDpeData} layout="vertical" margin={{ top: 20, right: 100, left: 10, bottom: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="class" type="category" tick={{fontWeight: 'bold', fontSize: 12}} width={40} />
                <Tooltip />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={25}>
                  {sortedDpeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
                <ReferenceLine y={metrics.dpeGroup} stroke="#1423DC" strokeWidth={2}>
                   <Label value="VOUS" position="right" fill="#1423DC" fontSize={10} fontWeight="900" dx={20} />
                </ReferenceLine>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Cards Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {renderStatCard('Moyenne', metrics.groupMean.toLocaleString(), 'kWh/an')}
        {renderStatCard('Médiane', metrics.groupMedian.toLocaleString(), 'kWh/an')}
        {renderStatCard('Percentile', Math.round(metrics.percentile).toString() + 'e', 'Classement', true)}
        {renderStatCard('Échantillon', metrics.totalSimilarHouseholds.toLocaleString(), 'foyers')}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex bg-slate-50 border-b border-slate-100">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-5 px-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'bg-white text-enedis-bright border-enedis-bright' 
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <span className="block text-xl mb-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-10">
          <div className="mb-10 flex flex-col md:flex-row justify-between gap-8">
             <div className="flex-1">
                <h2 className="text-2xl font-black text-enedis-title uppercase tracking-tighter mb-2">
                    {activeTab === 'distribution' ? 'Distribution de la consommation' : 
                    'Répartition du parc local (DPE)'}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                    Analyse des {metrics.totalSimilarHouseholds} foyers du cluster partageant les mêmes caractéristiques techniques.
                </p>
             </div>

             {/* Cluster Characteristics Card */}
             <div className="md:w-80 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Caractéristiques du Cluster</h3>
                <ul className="space-y-2">
                   {metrics.clusterCharacteristics.map((char, i) => (
                     <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-slate-600 leading-tight">
                        <span className="text-enedis-bright mt-0.5">•</span>
                        {char}
                     </li>
                   ))}
                </ul>
             </div>
          </div>

          <div className="bg-white rounded-xl p-4">
            {renderChart()}
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-10 pt-10 border-t border-slate-100">
             <div className="md:col-span-8">
                <div className="flex items-center gap-2 mb-6">
                   <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-l-4 border-enedis-bright pl-3">Interprétation de l'expert</h4>
                </div>
                <div className="bg-enedis-bright/5 p-8 rounded-2xl border border-enedis-bright/10">
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold italic">
                    "{expertInterpretation}"
                  </p>
                </div>
             </div>
             
             <div className="md:col-span-4">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 h-full flex flex-col justify-center">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-5 tracking-widest">Légende Expert</h5>
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-5 bg-enedis-bright rounded-sm"></div>
                         <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">VOTRE POSITION</span>
                      </div>
                      <div className="flex flex-col gap-2">
                         <div className="h-2 w-full bg-gradient-to-r from-enedis-green via-yellow-400 to-red-500 rounded-full opacity-50"></div>
                         <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                            <span>Sobriété</span>
                            <span>Surconsommation</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <SimilarHousingInfo />
      <HousingMap userAddress={userAddress} />
      <AdviceSection dpe={metrics.dpeGroup} differencePercentage={metrics.differencePercentage} />

      {/* Observatoire CTA Section */}
      {onOpenDashboard && (
        <div className="mt-12 bg-gradient-to-br from-enedis-blue to-enedis-bright p-1 rounded-3xl shadow-2xl shadow-enedis-blue/20">
          <div className="bg-white rounded-[22px] p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-enedis-blue/5 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📡</span>
            </div>
            <h3 className="text-2xl font-black text-enedis-title uppercase tracking-tighter mb-4">
              Explorez les dynamiques de votre territoire
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-xl mb-10 leading-relaxed">
              Découvrez la cartographie énergétique complète de votre département. Visualisez les performances par typologie de bâti et identifiez les zones prioritaires de rénovation à l'échelle locale.
            </p>
            <button 
              onClick={onOpenDashboard}
              className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-white bg-enedis-bright rounded-2xl shadow-xl shadow-enedis-bright/30 transition-all hover:bg-enedis-blue hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3 uppercase tracking-widest text-sm">
                Accéder à l'Observatoire Territorial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertView;
