import React, { useRef, useEffect } from 'react';
import { DPEGroup } from '../types';
import { QUICK_GESTURES, HIGH_IMPACT_GESTURES } from '../data/gestures';
import GestureCard from './GestureCard';
import GestureItem from './GestureItem';
import DigitalSobriety from './DigitalSobriety';
import NextStepsBlock from './NextStepsBlock';

const BASE = import.meta.env.BASE_URL;

interface Props {
  dpe: DPEGroup;
  differencePercentage: number;
  betterThan?: number;
}

function getEmmaMessage(betterThan: number, dpe: DPEGroup): { headline: string; body: string } {
  const isGoodDPE = [DPEGroup.A, DPEGroup.B, DPEGroup.C].includes(dpe);
  const isHighConsumption = betterThan < 40;

  if (isGoodDPE && !isHighConsumption) {
    return {
      headline: 'Votre logement est dans une bonne dynamique.',
      body: "Quelques gestes simples suffisent pour aller encore plus loin. Commencez par les plus faciles — l'habitude se construit progressivement.",
    };
  }
  if (isHighConsumption) {
    return {
      headline: 'Il y a des gains significatifs à portée de main.',
      body: 'Votre consommation est supérieure à celle de la majorité des logements similaires. Les gestes ci-dessous sont classés par impact — commencez par le haut.',
    };
  }
  return {
    headline: 'Vous êtes sur la bonne voie.',
    body: 'Ces recommandations sont basées sur votre situation réelle. Pas besoin de tout faire en même temps — choisissez un geste, installez-le, puis passez au suivant.',
  };
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="reveal-fade mb-6">
      <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-1">
        {label}
      </p>
      <h3 className="font-heading font-700 text-xl sm:text-2xl text-slate-900 tracking-tight">
        {title}
      </h3>
    </div>
  );
}

function useRevealAll(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.reveal-fade');
    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [containerRef]);
}

const NowWatt: React.FC<Props> = ({ dpe, differencePercentage, betterThan = 50 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useRevealAll(containerRef as React.RefObject<HTMLElement | null>);

  const { headline, body } = getEmmaMessage(betterThan, dpe);
  const isHighConsumption = betterThan < 40;

  const quickGestures = QUICK_GESTURES.filter(
    (g) => !g.dpeFilter || g.dpeFilter.includes(dpe)
  );

  const highImpactGestures = HIGH_IMPACT_GESTURES.filter(
    (g) => !g.dpeFilter || g.dpeFilter.includes(dpe)
  );

  return (
    <div ref={containerRef} className="bg-brand-bg rounded-3xl border border-brand-surface overflow-hidden">

      {/* ── Bloc 1 — Emma intro ── */}
      <div className="px-8 sm:px-10 pt-8 sm:pt-10 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-2">
          <img
            src={`${BASE}illustrations/emma/emma-a-la-solution.png`}
            alt="Emma avec la solution"
            className="w-20 h-auto flex-shrink-0"
          />
          <div>
            <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-1">
              Et maintenant ?
            </p>
            <h2 className="font-heading font-700 text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Now Watt ?
            </h2>
          </div>
        </div>
        <div className="reveal-fade bg-white rounded-2xl p-5 border border-brand-surface mt-4">
          <p className="font-heading font-600 text-slate-900 text-sm mb-1">{headline}</p>
          <p className="text-sm text-slate-500 font-body leading-relaxed">{body}</p>
        </div>
      </div>

      <div className="border-t border-brand-surface" />

      {/* ── Bloc 2 — Gestes rapides ── */}
      <div className="px-8 sm:px-10 py-8">
        <SectionHeading
          label="Effort minimal, effet immédiat"
          title="Les gestes du quotidien"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isHighConsumption
            ? [...quickGestures].sort((a, b) =>
                (b.highConsumptionPriority ? 1 : 0) - (a.highConsumptionPriority ? 1 : 0)
              )
            : quickGestures
          ).map((g, i) => (
            <GestureCard key={g.id} gesture={g} index={i} />
          ))}
        </div>
        <p className="text-[11px] text-slate-400 font-body text-right mt-4">
          Source : ADEME — 10 gestes pour économiser l&apos;énergie à la maison (nov. 2023)
        </p>
      </div>

      <div className="border-t border-brand-surface" />

      {/* ── Bloc 3 — Gestes à fort impact ── */}
      <div className="px-8 sm:px-10 py-8">
        <SectionHeading
          label="Un peu plus d'engagement, beaucoup plus d'économies"
          title="Les gestes à fort impact"
        />
        <div className="bg-white rounded-2xl border border-brand-surface divide-y divide-brand-surface overflow-hidden">
          {(isHighConsumption
            ? [...highImpactGestures].sort((a, b) =>
                (b.highConsumptionPriority ? 1 : 0) - (a.highConsumptionPriority ? 1 : 0)
              )
            : highImpactGestures
          ).map((g, i) => (
            <div key={g.id} className="px-6 last:border-b-0">
              <GestureItem gesture={g} index={i} />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 font-body text-right mt-4">
          Source : ADEME — 10 gestes pour économiser l&apos;énergie à la maison (nov. 2023)
        </p>
      </div>

      <div className="border-t border-brand-surface" />

      {/* ── Bloc 4 — Sobriété numérique ── */}
      <div className="px-8 sm:px-10 py-8">
        <SectionHeading
          label="L'énergie cachée de votre maison"
          title="Sobriété numérique"
        />
        <p className="text-sm text-slate-500 font-body leading-relaxed mb-6 -mt-3">
          Les appareils numériques représentent une part croissante de la consommation
          domestique. Ces gestes ne demandent aucun équipement supplémentaire.
        </p>
        <DigitalSobriety />
      </div>

      <div className="border-t border-brand-surface" />

      {/* ── Bloc 5 — Prochaines étapes ── */}
      <div className="px-8 sm:px-10 py-8 sm:pb-10">
        <SectionHeading
          label="Pour aller plus loin"
          title="Prochaines étapes"
        />
        <NextStepsBlock dpe={dpe} />
        <p className="text-xs text-slate-400 font-body text-center mt-8">
          Toutes les recommandations sont issues de documents ADEME et du service public France Rénov&apos;.
        </p>
      </div>
    </div>
  );
};

export default NowWatt;
