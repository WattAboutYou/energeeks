import React, { useRef, useEffect, useState } from 'react';
import { ComparisonMetrics, AddressData, DPEGroup, HouseData } from '../types';
import AdviceSection from './AdviceSection';
import HousingMap from './HousingMap';

interface SimpleViewProps {
  metrics: ComparisonMetrics;
  userAddress?: AddressData;
  houseData: HouseData;
  onOpenDashboard?: () => void;
}

const BASE = import.meta.env.BASE_URL;

function RevealEl({
  children,
  className = '',
  delay = '',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${delay} ${className}`}>
      {children}
    </div>
  );
}

function getDpeColors(dpe: string): { bg: string; text: string; border: string } {
  if (['A', 'B'].includes(dpe)) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (['C', 'D'].includes(dpe)) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
  if (dpe === 'E') return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
}

function getHousingIllustration(clusterLabel?: string): string {
  if (!clusterLabel) return `${BASE}illustrations/logements/maison-indiv1.png`;
  const lower = clusterLabel.toLowerCase();
  if (lower.includes('immeuble') || lower.includes('appartement') || lower.includes('collectif')) {
    return `${BASE}illustrations/logements/immeuble-style-1.png`;
  }
  if (lower.includes('garage')) return `${BASE}illustrations/logements/maison-garage.png`;
  if (lower.includes('moderne')) return `${BASE}illustrations/logements/maison-moderne.png`;
  if (lower.includes('jumeau') || lower.includes('bande')) return `${BASE}illustrations/logements/maison-indiv2.png`;
  return `${BASE}illustrations/logements/maison-indiv1.png`;
}

function getPositionMessage(betterThan: number): { headline: string; badge: string; badgeColor: string } {
  if (betterThan >= 75) {
    return {
      headline: `Vous consommez moins que ${betterThan}% des logements similaires.`,
      badge: 'Excellente performance',
      badgeColor: 'bg-brand-green/20 text-emerald-800 border-brand-green/30',
    };
  }
  if (betterThan >= 50) {
    return {
      headline: `Vous consommez moins que ${betterThan}% des logements similaires.`,
      badge: 'Performance correcte',
      badgeColor: 'bg-brand-yellow/30 text-yellow-800 border-brand-yellow/40',
    };
  }
  if (betterThan >= 25) {
    return {
      headline: `Vous consommez plus que ${100 - betterThan}% des logements similaires.`,
      badge: "Marge d'amélioration",
      badgeColor: 'bg-brand-orange/15 text-orange-800 border-brand-orange/30',
    };
  }
  return {
    headline: `Vous consommez nettement plus que ${100 - betterThan}% des logements similaires.`,
    badge: 'Consommation élevée',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
  };
}

const SimpleView: React.FC<SimpleViewProps> = ({ metrics, userAddress, houseData, onOpenDashboard }) => {
  const betterThan = Math.round(metrics.betterThanPercentage);
  const { headline, badge, badgeColor } = getPositionMessage(betterThan);
  const dpeColors = getDpeColors(houseData.dpe);

  // Jauge
  const median = metrics.groupMedian;
  const maxRange = median * 2;
  const userPos = Math.min(100, Math.max(0, (metrics.userConsumption / maxRange) * 100));
  const [gaugeWidth, setGaugeWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setGaugeWidth(userPos), 200);
    return () => clearTimeout(t);
  }, [userPos]);

  // cluster label for illustration
  const clusterLine = metrics.clusterCharacteristics.find((c) => c.startsWith('Cluster :'));
  const clusterLabel = clusterLine ? clusterLine.replace('Cluster : ', '') : undefined;
  const housingIllustration = getHousingIllustration(clusterLabel);

  return (
    <div className="font-body space-y-0">

      {/* ── SECTION 1 — Votre positionnement ───────────────────────── */}
      <section className="rounded-3xl overflow-hidden mb-8 shadow-lg shadow-slate-200/40">
        {/* Bandeau couleur */}
        <div className="bg-brand-blue px-8 pt-10 pb-16 text-white">
          <p className="text-xs font-heading font-600 text-white/60 uppercase tracking-widest mb-4">
            Votre positionnement
          </p>
          <h2 className="font-heading font-700 text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight mb-5 max-w-2xl">
            {headline}
          </h2>
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs font-heading font-600 uppercase tracking-wide ${badgeColor}`}>
            {badge}
          </span>
        </div>

        {/* Jauge */}
        <div className="bg-white px-8 pt-8 pb-10">
          <p className="text-xs font-heading font-600 text-slate-400 uppercase tracking-widest mb-6">
            Votre position dans le groupe
          </p>

          <div className="relative">
            {/* Labels */}
            <div className="flex justify-between text-xs font-body text-slate-400 mb-2">
              <span>0 kWh</span>
              <span>Médiane : {median.toLocaleString()} kWh</span>
              <span>{maxRange.toLocaleString()} kWh</span>
            </div>

            {/* Track */}
            <div className="relative h-3 rounded-full bg-gradient-to-r from-brand-green via-brand-yellow to-red-400 overflow-visible">
              {/* Marqueur médiane */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-600/40 rounded" />

              {/* Marqueur utilisateur */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
                style={{ left: `${gaugeWidth}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-5 h-5 bg-white border-4 border-brand-accent rounded-full shadow-lg shadow-brand-accent/30" />
              </div>
            </div>

            {/* Label vous */}
            <div
              className="absolute -bottom-8 transition-all duration-1000 ease-out"
              style={{ left: `${gaugeWidth}%`, transform: 'translateX(-50%)' }}
            >
              <span className="whitespace-nowrap text-xs font-heading font-600 text-brand-accent bg-white border border-brand-surface px-2 py-0.5 rounded-lg shadow-sm">
                Vous — {metrics.userConsumption.toLocaleString()} kWh
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-body text-right mt-12">
            Source : Base ADEME (2024) — traitée par Energeeks
          </p>
        </div>
      </section>

      {/* ── SECTION 2 — Pourquoi ce résultat ? ─────────────────────── */}
      <RevealEl className="bg-white rounded-3xl p-8 sm:p-10 mb-8 border border-brand-surface shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-8">
          <div className="flex-shrink-0">
            <img
              src={`${BASE}illustrations/emma/emma-a-la-solution.png`}
              alt="Emma explique"
              className="w-24 h-auto"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-3">
              Pourquoi ce résultat ?
            </p>
            <h3 className="font-heading font-700 text-xl text-slate-900 mb-3 tracking-tight">
              Votre logement a été comparé à{' '}
              <span className="text-brand-blue">{metrics.totalSimilarHouseholds.toLocaleString()} logements</span> similaires.
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Pas n'importe lesquels — uniquement ses jumeaux techniques : des logements
              partageant les mêmes caractéristiques physiques que le vôtre.
            </p>

            {/* Tags cluster */}
            <div className="flex flex-wrap gap-2">
              {metrics.clusterCharacteristics.map((char, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg border border-brand-surface rounded-xl text-xs font-body font-500 text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>
      </RevealEl>

      {/* ── SECTION 3 — Logements similaires ───────────────────────── */}
      <RevealEl className="bg-brand-bg rounded-3xl p-8 sm:p-10 mb-8 border border-brand-surface">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <img
              src={housingIllustration}
              alt="Illustration logement similaire"
              className="w-32 h-auto"
            />
          </div>
          <div>
            <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-2">
              Vos logements de référence
            </p>
            <h3 className="font-heading font-700 text-xl text-slate-900 mb-2 tracking-tight">
              {metrics.totalSimilarHouseholds.toLocaleString()} logements vous ressemblent.
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ces logements partagent les mêmes caractéristiques physiques que le vôtre.
              C'est ce groupe qui sert de référence pour évaluer votre consommation.
            </p>
          </div>
        </div>
      </RevealEl>

      {/* ── SECTION 4 — Votre DPE ───────────────────────────────────── */}
      <RevealEl className="bg-white rounded-3xl p-8 sm:p-10 mb-8 border border-brand-surface shadow-sm">
        <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-6">
          Votre DPE
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Badge DPE */}
          <div className={`flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-3xl border-2 ${dpeColors.bg} ${dpeColors.border}`}>
            <span className={`font-heading font-700 text-5xl leading-none ${dpeColors.text}`}>
              {houseData.dpe}
            </span>
            <span className="text-xs font-heading font-600 text-slate-400 uppercase tracking-wider mt-1">DPE</span>
          </div>

          {/* GES + explication */}
          <div className="flex-1 text-center sm:text-left">
            {houseData.ges && houseData.ges !== 'N/A' && (
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-brand-bg border border-brand-surface rounded-xl">
                <span className="text-xs font-heading font-600 text-slate-400 uppercase tracking-wider">GES</span>
                <span className="font-heading font-700 text-lg text-slate-800">{houseData.ges}</span>
              </div>
            )}
            <p className="text-sm text-slate-600 leading-relaxed">
              Le DPE évalue la performance énergétique de votre logement.
              Mais attention : un bon DPE ne garantit pas une faible consommation réelle — vos
              usages quotidiens jouent également un rôle important.
            </p>
            {houseData.numeroDpe && houseData.numeroDpe !== 'N/A' && (
              <p className="text-xs text-slate-400 font-body mt-3">
                N° DPE : {houseData.numeroDpe}
              </p>
            )}
          </div>
        </div>
      </RevealEl>

      {/* ── SECTION 5 — Impact CO2 ──────────────────────────────────── */}
      <RevealEl className="bg-white rounded-3xl p-8 sm:p-10 mb-8 border border-brand-surface shadow-sm">
        <p className="text-xs font-heading font-600 text-emerald-600 uppercase tracking-widest mb-6">
          Impact environnemental
        </p>
        <div className="flex flex-col sm:flex-row gap-8 items-center">
          <div className="text-center flex-1">
            <span className="font-heading font-700 text-4xl text-slate-900">
              {metrics.co2Tons.toFixed(2)}
            </span>
            <p className="text-xs font-body text-slate-400 uppercase tracking-wider mt-1">tCO₂ / an</p>
          </div>
          <div className="w-px h-16 bg-brand-surface hidden sm:block" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src={`${BASE}illustrations/icons/icon-photovolataique.png`}
                alt=""
                className="w-8 h-auto opacity-70"
              />
              <span className="font-heading font-700 text-4xl text-brand-green">
                {metrics.treesEquivalent}
              </span>
            </div>
            <p className="text-xs font-body text-slate-400 text-center max-w-[180px] mx-auto leading-snug">
              arbres nécessaires pour compenser votre empreinte annuelle
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-body mt-6 border-t border-brand-surface pt-4">
          Calcul basé sur 60 g CO₂ / kWh (mix français — source ADEME) et 25 kg / arbre / an.
        </p>
      </RevealEl>

      {/* Carte */}
      <RevealEl className="mb-8">
        <HousingMap userAddress={userAddress} />
      </RevealEl>

      {/* ── SECTION 6 — Now Watt ? ──────────────────────────────────── */}
      <RevealEl>
        <AdviceSection
          dpe={metrics.dpeGroup}
          differencePercentage={metrics.differencePercentage}
          betterThan={betterThan}
        />
      </RevealEl>

      {/* Observatoire CTA */}
      {onOpenDashboard && (
        <RevealEl className="mt-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-brand-surface shadow-sm text-center">
            <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-3">
              Aller plus loin
            </p>
            <h3 className="font-heading font-700 text-xl text-slate-900 mb-3 tracking-tight">
              Observatoire Territorial
            </h3>
            <p className="text-sm text-slate-500 font-body max-w-lg mx-auto mb-6 leading-relaxed">
              Explorez la cartographie énergétique complète de votre département.
              Réservé aux professionnels et chercheurs.
            </p>
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent text-white font-heading font-600 rounded-2xl shadow-lg shadow-brand-accent/20 hover:bg-brand-blue hover:-translate-y-0.5 transition-all text-sm uppercase tracking-wide"
            >
              Accéder à l'Observatoire
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </RevealEl>
      )}
    </div>
  );
};

export default SimpleView;
