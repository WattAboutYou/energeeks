import React, { useState, useRef, useEffect } from 'react';
import { getDepartments, getCities } from '../services/dataService';
import AddressAutocomplete from './AddressAutocomplete';

interface LandingStoryProps {
  onAddressSelected: (addressId: string) => void;
}

const BASE = import.meta.env.BASE_URL;

// ─── Reveal helpers ──────────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal(0.06);
  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={`reveal ${className}`}>
      {children}
    </section>
  );
}

function RevealEl({
  children, className = '', delay = '', variant = 'reveal', tag: Tag = 'div',
}: {
  children: React.ReactNode; className?: string; delay?: string;
  variant?: 'reveal' | 'reveal-fade' | 'reveal-blur' | 'text-appear';
  tag?: keyof JSX.IntrinsicElements;
}) {
  const ref = useReveal(0.06);
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={`${variant} ${delay} ${className}`}>
      {children}
    </Tag>
  );
}

function ChaosBubble({ children, color, delay }: { children: React.ReactNode; color: string; delay?: string }) {
  const ref = useReveal(0.1);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${delay ?? ''} p-4 rounded-2xl border ${color} text-sm text-slate-700 leading-snug hover-lift cursor-default`}>
      {children}
    </div>
  );
}

// ─── Scroll arrow ────────────────────────────────────────────────────────────

function ScrollArrow({ light = false }: { light?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 py-6 select-none pointer-events-none" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-5 h-5 bounce-down ${light ? 'text-white/40' : 'text-slate-300'}`}
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      ))}
    </div>
  );
}

// ─── DPE Usage pill ──────────────────────────────────────────────────────────

function UsagePill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-brand-surface shadow-sm text-sm font-body text-slate-700">
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Progressive form ────────────────────────────────────────────────────────

interface FormState {
  step: 0 | 1 | 2;
  dept: string;
  city: string;
  addressId: string;
}

const DEMO_DEPT = '91';
const DEMO_CITY = 'Évry-Courcouronnes';
const DEMO_ADDRESS_ID = '2291E1747972G';
const DEMO_ADDRESS_QUERY = '12 SQUARE ALBERT EINSTEIN';

function ProgressiveForm({ onSubmit }: { onSubmit: (addressId: string) => void }) {
  const departments = getDepartments();

  const [form, setForm] = useState<FormState>({
    step: 2,
    dept: DEMO_DEPT,
    city: DEMO_CITY,
    addressId: DEMO_ADDRESS_ID,
  });

  const cityRef = useRef<HTMLDivElement>(null);
  const addrRef = useRef<HTMLDivElement>(null);

  const currentCities = form.dept ? getCities(form.dept) : [];

  const goToCity = () => {
    setForm((f) => ({ ...f, step: 1 }));
    setTimeout(() => cityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  };

  const goToAddress = (city: string) => {
    setForm((f) => ({ ...f, city, step: 2 }));
    setTimeout(() => addrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.addressId) onSubmit(form.addressId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Étape 1 — Département */}
      <div className="slide-in-up bg-white rounded-2xl border border-brand-surface p-6 shadow-sm">
        <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-1">Étape 1</p>
        <label className="block text-sm font-heading font-600 text-slate-700 mb-3">Département</label>
        <select
          value={form.dept}
          onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value, city: '', addressId: '', step: 0 }))}
          className="block w-full pl-4 pr-10 py-3.5 text-sm border border-brand-surface bg-brand-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/25 focus:border-brand-blue transition-all font-body text-slate-800"
        >
          {departments.map((d) => (
            <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
          ))}
        </select>

        {form.step === 0 && (
          <button
            type="button" onClick={goToCity} disabled={!form.dept}
            className="mt-4 w-full py-3.5 px-5 bg-brand-accent text-white font-heading font-600 text-sm rounded-xl hover:bg-brand-blue transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-brand-accent/20"
          >
            Continuer
          </button>
        )}
      </div>

      {/* Étape 2 — Ville */}
      {form.step >= 1 && (
        <div ref={cityRef} className="slide-in-up bg-white rounded-2xl border border-brand-surface p-6 shadow-sm">
          <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-1">Étape 2</p>
          <label className="block text-sm font-heading font-600 text-slate-700 mb-3">Ville</label>
          <select
            value={form.city}
            onChange={(e) => goToAddress(e.target.value)}
            className="block w-full pl-4 pr-10 py-3.5 text-sm border border-brand-surface bg-brand-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/25 focus:border-brand-blue transition-all font-body text-slate-800"
          >
            <option value="">-- Sélectionnez votre ville --</option>
            {currentCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      )}

      {/* Étape 3 — Adresse */}
      {form.step >= 2 && (
        <div ref={addrRef} className="slide-in-up bg-white rounded-2xl border border-brand-surface p-6 shadow-sm">
          <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-1">Étape 3</p>
          <label className="block text-sm font-heading font-600 text-slate-700 mb-3">Adresse exacte</label>
          <AddressAutocomplete
            department={form.dept}
            city={form.city}
            defaultQuery={form.city === demoCityInData ? DEMO_ADDRESS_QUERY : undefined}
            onSelect={(id) => setForm((f) => ({ ...f, addressId: id }))}
          />

          {form.addressId && (
            <button
              type="submit"
              className="mt-4 w-full py-4 px-5 bg-brand-accent text-white font-heading font-700 text-sm rounded-xl uppercase tracking-wide hover:bg-brand-blue hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-brand-accent/25 slide-in-up"
            >
              Analyser mon logement
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 font-body text-center leading-relaxed pt-2">
        Service disponible pour les logements disposant d'un DPE valide (post juillet 2021).
      </p>
    </form>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const LandingStory: React.FC<LandingStoryProps> = ({ onAddressSelected }) => {
  const [dpeConfirmed, setDpeConfirmed] = useState(false);
  const [noDpeOpen, setNoDpeOpen] = useState(false);
  const section4Ref = useRef<HTMLElement>(null);

  const handleOui = () => {
    setDpeConfirmed(true);
    setTimeout(() => {
      section4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 450);
  };

  return (
    <div className="font-body">

      {/* ── SECTION 1 — Emma accueille ──────────────────────────────── */}
      <RevealSection className="py-24 sm:py-36 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-14 md:gap-24">

            <RevealEl variant="reveal-blur" delay="delay-100" className="flex-shrink-0 w-52 md:w-72">
              <img
                src={`${BASE}illustrations/emma/emma-accueil-explique.png`}
                alt="Emma vous accueille"
                className="w-full h-auto drop-shadow-md"
              />
            </RevealEl>

            <div className="flex-1 text-center md:text-left">
              <RevealEl tag="p" variant="reveal-fade" delay="delay-75"
                className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-5">
                Votre guide
              </RevealEl>
              <RevealEl tag="h1" variant="reveal" delay="delay-150"
                className="font-heading font-700 text-5xl sm:text-6xl lg:text-7xl text-slate-900 leading-[1.05] tracking-tight mb-8">
                Bonjour,<br />moi c'est Emma.
              </RevealEl>
              <div className="space-y-4 max-w-xl">
                <RevealEl tag="p" variant="text-appear" delay="delay-300"
                  className="text-lg text-slate-600 leading-relaxed">
                  Comme beaucoup de propriétaires et locataires, vous cherchez peut-être
                  à réduire votre facture d'électricité.
                </RevealEl>
                <RevealEl tag="p" variant="text-appear" delay="delay-500"
                  className="text-lg text-slate-600 leading-relaxed">
                  Avant de savoir <strong className="text-slate-800">quoi faire</strong>,
                  il faut d'abord comprendre{' '}
                  <strong className="text-slate-800">où vous vous situez</strong> réellement.
                </RevealEl>
                <RevealEl tag="p" variant="text-appear" delay="delay-700"
                  className="text-lg text-brand-blue font-medium">
                  Je vais vous aider.
                </RevealEl>
              </div>
            </div>
          </div>
        </div>
        <ScrollArrow />
      </RevealSection>

      {/* ── SECTION 2 — Le dilemme de Marie ────────────────────────── */}
      <RevealSection className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row-reverse items-center gap-14 md:gap-24">

            <RevealEl variant="reveal-blur" delay="delay-100" className="flex-shrink-0 w-44 md:w-60">
              <img
                src={`${BASE}illustrations/marie/marie-tient-devisrenov.png`}
                alt="Marie tient son DPE et un devis de rénovation"
                className="w-full h-auto drop-shadow-sm"
              />
            </RevealEl>

            <div className="flex-1 text-center md:text-left">
              <RevealEl tag="p" variant="reveal-fade" delay="delay-75"
                className="text-xs font-heading font-600 text-brand-orange uppercase tracking-widest mb-5">
                Vous vous reconnaissez ?
              </RevealEl>
              <RevealEl tag="h2" variant="reveal" delay="delay-150"
                className="font-heading font-700 text-4xl sm:text-5xl text-slate-900 leading-[1.1] tracking-tight mb-8">
                Le dilemme de Marie
              </RevealEl>
              <div className="space-y-4 max-w-xl">
                <RevealEl tag="p" variant="text-appear" delay="delay-300"
                  className="text-base text-slate-600 leading-relaxed">
                  Comme Marie, vous avez peut-être reçu un DPE, regardé des devis de
                  rénovation, lu des articles sur les économies d'énergie.
                </RevealEl>
                <RevealEl tag="p" variant="text-appear" delay="delay-500"
                  className="text-base text-slate-600 leading-relaxed">
                  Mais entre les recommandations, les travaux proposés et les montants
                  annoncés, il n'est pas toujours facile de savoir{' '}
                  <strong className="text-slate-800">quoi faire en premier</strong>.
                </RevealEl>
              </div>
            </div>
          </div>
        </div>
        <ScrollArrow />
      </RevealSection>

      {/* ── SECTION 3 — DPE question ────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-brand-blue relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <RevealEl tag="p" variant="reveal-fade" delay="delay-75"
            className="text-xs font-heading font-600 text-white/60 uppercase tracking-widest mb-5">
            Première question
          </RevealEl>
          <RevealEl tag="h2" variant="reveal" delay="delay-150"
            className="font-heading font-700 text-4xl sm:text-5xl text-white leading-[1.1] tracking-tight mb-5">
            Connaissez-vous votre DPE ?
          </RevealEl>
          <RevealEl delay="delay-250" variant="reveal-fade" tag="p"
            className="text-white/80 text-lg max-w-lg mx-auto mb-12 leading-relaxed">
            Le Diagnostic de Performance Énergétique évalue la performance
            thermique de votre logement, de A (très performant) à G (énergivore).
          </RevealEl>

          {!dpeConfirmed ? (
            <RevealEl delay="delay-350" className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleOui}
                className="px-10 py-4 bg-white text-brand-accent font-heading font-700 text-base rounded-2xl hover:bg-brand-yellow hover:text-slate-900 transition-all duration-200 hover:-translate-y-1 shadow-xl shadow-black/10"
              >
                Oui, j'ai mon DPE
              </button>
              <button
                onClick={() => setNoDpeOpen((v) => !v)}
                className="px-10 py-4 border-2 border-white/40 text-white font-heading font-600 text-base rounded-2xl hover:border-white hover:bg-white/10 transition-all duration-200"
              >
                Non / Je ne sais pas
              </button>
            </RevealEl>
          ) : (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/15 backdrop-blur rounded-2xl border border-white/25">
                <span className="text-white font-heading font-600">Parfait — continuons</span>
                <span className="text-xl">✓</span>
              </div>
              <div className="mt-2 bounce-down text-white/60">
                <svg className="w-7 h-7 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          {noDpeOpen && (
            <div className="mt-8 p-8 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 text-left animate-fade-in max-w-xl mx-auto">
              <h3 className="font-heading font-600 text-white text-xl mb-3">Pas de DPE ? Pas de problème.</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                Vous pourrez utiliser Watt About You dès que vous disposerez d'un DPE
                réalisé après le 1er juillet 2021. En attendant, vous pouvez en obtenir
                une estimation gratuite en ligne.
              </p>
              <a
                href="https://desptiteseconomies.fr/"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow text-slate-900 font-heading font-600 rounded-2xl hover:bg-white transition-all duration-200 text-sm"
              >
                Estimer mon DPE gratuitement
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        <div className="relative">
          <ScrollArrow light />
        </div>
      </section>

      {/* ── SECTION 3.5 — Ce que le DPE mesure vraiment ─────────────── */}
      <section ref={section4Ref as React.RefObject<HTMLElement>} className="py-20 sm:py-28 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <RevealEl variant="reveal" className="text-center mb-12">
            <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-4">
              Ce que mesure le DPE
            </p>
            <h2 className="font-heading font-700 text-4xl sm:text-5xl text-slate-900 leading-[1.1] tracking-tight mb-4">
              Un indicateur utile,<br />mais partiel.
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
              Le DPE évalue l'efficacité thermique de votre logement — autrement dit,
              à quel point il conserve la chaleur et évite les pertes d'énergie inutiles.
            </p>
          </RevealEl>

          {/* Les 5 usages */}
          <RevealEl variant="reveal-blur" delay="delay-150"
            className="bg-white rounded-3xl border border-brand-surface p-8 mb-8 shadow-sm">
            <p className="text-xs font-heading font-600 text-slate-400 uppercase tracking-widest mb-5">
              Il couvre uniquement ces 5 usages
            </p>
            <div className="flex flex-wrap gap-3">
              <UsagePill icon="🔥" label="Chauffage" />
              <UsagePill icon="🚿" label="Eau chaude sanitaire" />
              <UsagePill icon="💡" label="Éclairage" />
              <UsagePill icon="❄️" label="Climatisation" />
              <UsagePill icon="⚙️" label="Auxiliaires (PAC, ventilation)" />
            </div>
            <div className="mt-6 pt-5 border-t border-brand-surface">
              <p className="text-sm text-slate-500 font-body leading-relaxed">
                <strong className="text-slate-700">Ce qu'il ne couvre pas :</strong>{' '}
                votre électroménager, vos appareils connectés, votre comportement quotidien,
                vos horaires de présence, votre lave-linge, vos écrans.
                Tout ce qui fait la réalité de votre consommation.
              </p>
            </div>
          </RevealEl>

          {/* L'insight clé */}
          <RevealEl variant="reveal-blur" delay="delay-300">
            <div className="flex flex-col sm:flex-row items-start gap-6 bg-white rounded-3xl border border-brand-surface p-8 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-heading font-600 text-slate-900 text-base mb-2">
                  Le DPE, seul, ne suffit pas.
                </p>
                <p className="text-sm text-slate-500 font-body leading-relaxed">
                  Entre des logements techniquement similaires, les différences de
                  consommation électrique réelle sont très peu expliquées par le DPE.
                  Des logements avec le même DPE peuvent avoir des consommations
                  très différentes — et des logements avec un DPE différent peuvent
                  consommer la même chose.
                </p>
                <p className="text-sm text-slate-500 font-body leading-relaxed mt-3">
                  C'est pourquoi comparer votre logement à ses{' '}
                  <strong className="text-slate-700">vrais jumeaux</strong> — même type,
                  même période, même énergie — est bien plus révélateur.
                </p>
              </div>
            </div>
          </RevealEl>
        </div>
        <ScrollArrow />
      </section>

      {/* ── SECTION 4 — Le chaos des conseils ──────────────────────── */}
      <section className="py-24 sm:py-32 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <RevealEl tag="p" variant="reveal-fade"
              className="text-xs font-heading font-600 text-brand-orange uppercase tracking-widest mb-5">
              La situation de départ
            </RevealEl>
            <RevealEl tag="h2" variant="reveal" delay="delay-100"
              className="font-heading font-700 text-4xl sm:text-5xl text-slate-900 leading-[1.1] tracking-tight">
              Tout le monde a une opinion.
            </RevealEl>
            <RevealEl tag="p" variant="text-appear" delay="delay-300"
              className="text-slate-500 mt-4 text-xl max-w-md mx-auto">
              Mais qui faut-il écouter ?
            </RevealEl>
          </div>

          {/* Bulles desktop */}
          <div className="hidden md:grid grid-cols-3 gap-6 w-full max-w-3xl mx-auto mb-8">
            <ChaosBubble color="bg-brand-orange/10 border-brand-orange/20" delay="delay-100">
              <span className="text-xs font-heading font-600 text-brand-orange uppercase tracking-wide block mb-1">L'artisan</span>
              "Il faut changer la chaudière. Ça coûte 15 000 €."
            </ChaosBubble>
            <div />
            <ChaosBubble color="bg-brand-yellow/20 border-brand-yellow/30" delay="delay-200">
              <span className="text-xs font-heading font-600 text-yellow-700 uppercase tracking-wide block mb-1">L'ANAH</span>
              "Remplissez d'abord le dossier de 47 pages."
            </ChaosBubble>
          </div>

          <div className="hidden md:flex justify-between w-full max-w-3xl mx-auto items-center gap-6">
            <ChaosBubble color="bg-brand-green/10 border-brand-green/30" delay="delay-300">
              <span className="text-xs font-heading font-600 text-emerald-600 uppercase tracking-wide block mb-1">Votre voisin</span>
              "Moi j'ai mis du solaire. Remboursé en 8 ans."
            </ChaosBubble>
            <div className="flex-shrink-0">
              <RevealEl variant="reveal-blur">
                <img src={`${BASE}illustrations/marie/marie-overwhelmed.png`}
                  alt="Marie dépassée par les conseils" className="w-36 h-auto" />
              </RevealEl>
            </div>
            <ChaosBubble color="bg-brand-blue/10 border-brand-blue/20" delay="delay-400">
              <span className="text-xs font-heading font-600 text-brand-blue uppercase tracking-wide block mb-1">Le conseiller</span>
              "Commencez par l'isolation. Mais laquelle ?"
            </ChaosBubble>
          </div>

          <div className="hidden md:grid grid-cols-3 gap-6 w-full max-w-3xl mx-auto mt-8">
            <div />
            <ChaosBubble color="bg-slate-100 border-slate-200" delay="delay-500">
              <span className="text-xs font-heading font-600 text-slate-500 uppercase tracking-wide block mb-1">Internet</span>
              "Ça dépend... de votre situation."
            </ChaosBubble>
            <div />
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3 w-full max-w-sm mx-auto">
            <RevealEl variant="reveal-blur" className="mx-auto w-28 mb-6">
              <img src={`${BASE}illustrations/marie/marie-overwhelmed.png`} alt="Marie dépassée" className="w-full h-auto" />
            </RevealEl>
            {[
              { label: "L'artisan", text: '"Il faut changer la chaudière. 15 000 €."', color: 'bg-brand-orange/10 border-brand-orange/20' },
              { label: "L'ANAH", text: '"Remplissez le dossier de 47 pages."', color: 'bg-brand-yellow/20 border-brand-yellow/30' },
              { label: 'Votre voisin', text: "\"Moi j'ai mis du solaire.\"", color: 'bg-brand-green/10 border-brand-green/30' },
              { label: 'Le conseiller', text: '"Commencez par l\'isolation."', color: 'bg-brand-blue/10 border-brand-blue/20' },
              { label: 'Internet', text: '"Ça dépend..."', color: 'bg-slate-100 border-slate-200' },
            ].map(({ label, text, color }) => (
              <div key={label} className={`p-3 rounded-2xl border ${color} text-sm text-slate-700`}>
                <span className="text-xs font-heading font-600 text-slate-500 uppercase tracking-wide block mb-0.5">{label}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <ScrollArrow />
      </section>

      {/* ── SECTION 5 — La révélation ───────────────────────────────── */}
      <RevealSection className="py-24 sm:py-36 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-14">

            <RevealEl variant="reveal-blur" delay="delay-100" className="flex-shrink-0 w-40 md:w-56">
              <img src={`${BASE}illustrations/emma/emma-a-la-solution.png`}
                alt="Emma a la solution" className="w-full h-auto drop-shadow-sm" />
            </RevealEl>

            <div className="flex-1 text-center md:text-left space-y-6">
              <RevealEl tag="p" variant="text-appear" delay="delay-150"
                className="text-slate-500 text-lg leading-relaxed">
                Avant de chercher <em>comment</em> réduire votre consommation...
              </RevealEl>
              <RevealEl tag="p" variant="text-appear" delay="delay-350"
                className="text-slate-600 text-lg leading-relaxed">
                ...il faut d'abord répondre à une autre question.
              </RevealEl>
              <RevealEl variant="reveal-blur" delay="delay-500"
                className="bg-white rounded-3xl p-8 border border-brand-surface shadow-md">
                <p className="font-heading font-700 text-3xl sm:text-4xl text-slate-900 leading-tight tracking-tight">
                  Votre logement consomme-t-il
                  <span className="text-brand-blue"> réellement trop ?</span>
                </p>
              </RevealEl>
              <RevealEl tag="p" variant="text-appear" delay="delay-700"
                className="text-slate-600 text-lg leading-relaxed">
                Pour le savoir, il faut le comparer à des logements{' '}
                <strong className="text-slate-800">similaires au vôtre</strong>.
              </RevealEl>
            </div>
          </div>
        </div>
        <ScrollArrow />
      </RevealSection>

      {/* ── SECTION 6 — Les jumeaux techniques ─────────────────────── */}
      <RevealSection className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">
            <RevealEl tag="p" variant="reveal-fade"
              className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-5">
              Notre méthode
            </RevealEl>
            <RevealEl tag="h2" variant="reveal" delay="delay-100"
              className="font-heading font-700 text-4xl sm:text-5xl text-slate-900 leading-[1.1] tracking-tight max-w-2xl mx-auto">
              Comparer une maison ancienne avec un appartement récent n'a pas de sens.
            </RevealEl>
            <RevealEl tag="p" variant="text-appear" delay="delay-300"
              className="text-slate-500 mt-5 text-lg max-w-xl mx-auto leading-relaxed">
              Nous comparons votre logement uniquement à ses{' '}
              <strong className="text-slate-800">jumeaux techniques</strong> :
              des logements aux mêmes caractéristiques physiques.
            </RevealEl>
          </div>

          <RevealEl variant="reveal-blur" delay="delay-200" className="relative max-w-3xl mx-auto">
            <img src={`${BASE}illustrations/logements/tous-les-logements.png`}
              alt="Panel de logements variés en Essonne" className="w-full h-auto opacity-90" />
          </RevealEl>

          <RevealEl variant="reveal" delay="delay-400" className="mt-14 text-center">
            <p className="font-heading font-700 text-6xl text-brand-blue">27</p>
            <p className="text-slate-500 text-sm mt-2">groupes de logements identifiés en Essonne</p>
          </RevealEl>
        </div>
        <ScrollArrow />
      </RevealSection>

      {/* ── SECTION 7 — Formulaire progressif ──────────────────────── */}
      <section className="py-24 sm:py-32 bg-brand-bg">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <RevealEl variant="reveal" className="text-center mb-12">
            <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-4">Prêt ?</p>
            <h2 className="font-heading font-700 text-4xl sm:text-5xl text-slate-900 leading-[1.1] tracking-tight mb-4">
              Découvrez où se situe<br />votre logement.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
              Comparez votre consommation à celle de logements techniquement similaires.
            </p>
          </RevealEl>

          <RevealEl variant="reveal-blur" delay="delay-200">
            <ProgressiveForm onSubmit={onAddressSelected} />
          </RevealEl>
        </div>
      </section>

    </div>
  );
};

export default LandingStory;
