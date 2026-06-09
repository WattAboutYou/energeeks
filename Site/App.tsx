import React, { useState } from 'react';
import Header from './components/Header';
import LandingStory from './components/LandingStory';
import { DPEGroup, ComparisonMetrics, AddressData, HouseData } from './types';
import {
  calculateMetrics,
  getAddressDetails,
  fetchHouseData,
  initData,
} from './services/dataService';
import SimpleView from './components/SimpleView';
import ExpertView from './components/ExpertView';
import ExpertDashboard from './components/ExpertDashboard';

enum Step {
  INTRO = 0,
  LOADING = 2,
  RESULTS = 3,
  DASHBOARD = 4,
}

const App: React.FC = () => {
  const [dataReady, setDataReady] = React.useState(false);
  const [step, setStep] = useState<Step>(Step.INTRO);
  const [previousStep, setPreviousStep] = useState<Step>(Step.INTRO);
  const [houseData, setHouseData] = useState<HouseData | null>(null);
  const [addressData, setAddressData] = useState<AddressData | undefined>(undefined);
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);
  const [isExpertMode, setIsExpertMode] = useState(false);

  React.useEffect(() => {
    initData().then(() => setDataReady(true));
  }, []);

  const handleAddressSelected = (addressId: string) => {
    setStep(Step.LOADING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const fullAddress = getAddressDetails(addressId);
      setAddressData(fullAddress);
      const data = fetchHouseData(addressId);
      setHouseData(data);
      const computedMetrics = calculateMetrics(
        data.consumption,
        data.dpe,
        data.surface,
        data.clusterLabel
      );
      setMetrics(computedMetrics);
      setStep(Step.RESULTS);
    }, 1500);
  };

  const resetApp = () => {
    setStep(Step.INTRO);
    setHouseData(null);
    setAddressData(undefined);
    setMetrics(null);
    setIsExpertMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDashboard = () => {
    setPreviousStep(step);
    setStep(Step.DASHBOARD);
  };

  if (!dataReady) {
    return (
      <div className="min-h-screen bg-brand-bg font-body text-slate-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-brand-blue/10" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
          </div>
          <h2 className="font-heading font-700 text-lg text-slate-800 tracking-tight mt-8">
            Chargement des données...
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-body">
            Préparation de la base territoriale
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-body text-slate-800 flex flex-col">
      <Header onLogoClick={resetApp} />

      <main className="flex-grow">

        {/* ── DASHBOARD ──────────────────────────────────────────────── */}
        {step === Step.DASHBOARD && (
          <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 w-full">
            <ExpertDashboard onBack={() => setStep(previousStep)} />
          </div>
        )}

        {/* ── LANDING — Storytelling ──────────────────────────────────── */}
        {step === Step.INTRO && (
          <LandingStory
            onAddressSelected={handleAddressSelected}
          />
        )}


        {/* ── CHARGEMENT ──────────────────────────────────────────────── */}
        {step === Step.LOADING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in px-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-brand-blue/10" />
              <div className="absolute inset-0 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
            </div>
            <h3 className="font-heading font-700 text-lg text-slate-800 mt-8 tracking-tight">
              Recherche de vos jumeaux techniques...
            </h3>
            <p className="text-sm text-slate-400 mt-2 font-body">
              Interrogation de la base ADEME en cours
            </p>
          </div>
        )}

        {/* ── RÉSULTATS ───────────────────────────────────────────────── */}
        {step === Step.RESULTS && metrics && houseData && (
          <div className="animate-fade-in pb-20">
            {/* Barre de contexte résultats */}
            <div className="bg-white border-b border-brand-surface">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-heading font-600 text-brand-blue uppercase tracking-widest mb-0.5">
                    Résultats de l'analyse
                  </p>
                  <h2 className="font-heading font-700 text-lg text-slate-900 tracking-tight">
                    {addressData?.street}, {addressData?.city}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle Simple / Expert */}
                  <div className="flex items-center bg-brand-bg rounded-2xl p-1 border border-brand-surface">
                    <button
                      onClick={() => setIsExpertMode(false)}
                      className={`px-5 py-2 rounded-xl text-xs font-heading font-600 uppercase tracking-wide transition-all ${
                        !isExpertMode
                          ? 'bg-brand-accent text-white shadow-md'
                          : 'text-slate-400 hover:text-brand-accent'
                      }`}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => setIsExpertMode(true)}
                      className={`px-5 py-2 rounded-xl text-xs font-heading font-600 uppercase tracking-wide transition-all ${
                        isExpertMode
                          ? 'bg-brand-accent text-white shadow-md'
                          : 'text-slate-400 hover:text-brand-accent'
                      }`}
                    >
                      Expert
                    </button>
                  </div>
                  {/* Nouvelle recherche */}
                  <button
                    onClick={resetApp}
                    className="text-xs font-heading font-600 text-slate-400 hover:text-brand-accent transition-colors hidden sm:block"
                  >
                    Nouvelle recherche
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu du diagnostic */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              {isExpertMode ? (
                <ExpertView
                  metrics={metrics}
                  userAddress={addressData}
                  onOpenDashboard={openDashboard}
                />
              ) : (
                <SimpleView
                  metrics={metrics}
                  userAddress={addressData}
                  houseData={houseData}
                  onOpenDashboard={openDashboard}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-brand-surface py-10 text-center mt-auto">
        <div className="flex flex-col items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}illustrations/logos/logo-energeeks.png`}
            alt="Energeeks"
            className="h-7 w-auto opacity-50"
          />
          <p className="text-xs font-body text-slate-400">
            © 2024 Watt About You par Energeeks — Données DPE issues de l'ADEME
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
