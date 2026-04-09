
import React, { useState } from 'react';
import Header from './components/Header';
import { DPEGroup, ComparisonMetrics, AddressData, HouseData } from './types';
import { calculateMetrics, getDepartments, getCities, getAddressDetails, fetchHouseData, initData } from './services/dataService';
import { generatePDFReport } from './services/pdfService';
import SimpleView from './components/SimpleView';
import ExpertView from './components/ExpertView';
import ExpertDashboard from './components/ExpertDashboard';
import AddressAutocomplete from './components/AddressAutocomplete';

enum Step {
  INTRO = 0,
  ADDRESS_SELECT = 1,
  LOADING = 2,
  RESULTS = 3,
  DASHBOARD = 4,
  NO_DPE = 5
}

const DpeTooltipText = "Le diagnostic de performance énergétique (DPE) renseigne sur la performance énergétique et climatique d’un logement ou d’un bâtiment (étiquettes A à G), en évaluant sa consommation d’énergie et son impact en terme d’émissions de gaz à effet de serre. Il s’inscrit dans le cadre de la politique énergétique définie au niveau européen afin de réduire la consommation d’énergie des bâtiments et de limiter les émissions de gaz à effet de serre et sert notamment à identifier les passoires énergétiques (étiquettes F et G du DPE, c’est-à-dire les logements qui consomment le plus d’énergie et/ou émettent le plus de gaz à effet de serre).";

const DpeTooltip = () => (
  <span className="relative group cursor-help text-enedis-bright underline decoration-dotted inline-block">
    DPE
    <span className="absolute z-[100] bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 sm:w-96 p-4 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl opacity-0 overflow-visible group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl font-medium leading-relaxed text-left invisible group-hover:visible before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-t-slate-900">
      {DpeTooltipText}
    </span>
  </span>
);

const App: React.FC = () => {
  const [dataReady, setDataReady] = React.useState(false);
  const [step, setStep] = useState<Step>(Step.INTRO);
  const [hasRecentDPE, setHasRecentDPE] = useState<boolean | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true);
  const [previousStep, setPreviousStep] = useState<Step>(Step.INTRO);

  React.useEffect(() => {
    initData().then(() => setDataReady(true));
  }, []);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [houseData, setHouseData] = useState<HouseData | null>(null);
  const [addressData, setAddressData] = useState<AddressData | undefined>(undefined);
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false);

  const departments = getDepartments();
  const cities = selectedDept ? getCities(selectedDept) : [];

  const handleDpeCheck = (hasRecent: boolean) => {
    setHasRecentDPE(hasRecent);
    if (hasRecent) {
      setStep(Step.ADDRESS_SELECT);
    } else {
      setStep(Step.NO_DPE);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) return;
    setStep(Step.LOADING);
    setTimeout(() => {
      const fullAddress = getAddressDetails(selectedAddressId);
      setAddressData(fullAddress);
      const data = fetchHouseData(selectedAddressId);
      setHouseData(data);
      const computedMetrics = calculateMetrics(data.consumption, data.dpe, data.surface, data.clusterLabel);
      setMetrics(computedMetrics);
      setStep(Step.RESULTS);
    }, 1500);
  };

  const resetApp = () => {
    setStep(Step.INTRO);
    setHasRecentDPE(null);
    setSelectedDept('');
    setSelectedCity('');
    setSelectedAddressId('');
    setHouseData(null);
    setAddressData(undefined);
    setMetrics(null);
    setIsExpertMode(false);
  };

  const openDashboard = () => {
    setPreviousStep(step);
    setStep(Step.DASHBOARD);
  };

  if (!dataReady) {
    return (
      <div className="min-h-screen bg-enedis-light font-sans text-slate-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-enedis-bright/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-enedis-bright border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mt-8 uppercase">Chargement des données...</h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">Préparation de la base territoriale</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-enedis-light font-sans text-slate-800 flex flex-col">
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-enedis-title mb-6 tracking-tight uppercase border-b-2 border-enedis-bright pb-4 inline-block">Bienvenue sur notre site : Watt About You</h2>
            <div className="space-y-4 text-slate-600 font-medium leading-relaxed mb-8">
              <p>Découvrez comment se situe votre logement ! Watt About You vous permet de comparer votre consommation électrique ainsi que votre <DpeTooltip /> (Diagnostic de Performance Énergétique) avec des biens similaires au vôtre.</p>
              <p>À partir de vos caractéristiques physiques, nous identifions un groupe de logements comparables (ou "cluster"). Vous pourrez ainsi évaluer précisément votre performance énergétique par rapport à des foyers aux profils semblables.</p>
            </div>
            <button 
              onClick={() => setShowWelcomeModal(false)}
              className="w-full py-4 px-6 bg-enedis-bright text-white font-bold rounded-2xl hover:bg-enedis-blue transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
      <Header onLogoClick={resetApp} />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 w-full">
        {step === Step.DASHBOARD && <ExpertDashboard onBack={() => setStep(previousStep)} />}
        {step === Step.INTRO && (
          <div className="max-w-2xl mx-auto space-y-10 animate-fade-in">
            <div className="text-center">
              <h2 className="text-4xl font-black text-enedis-title mb-4 tracking-tighter uppercase">Watt About You</h2>
              <p className="text-lg text-slate-500 font-medium">Analysez la performance de votre logement en quelques secondes.</p>
              <p className="text-[11px] text-slate-400 mt-3 font-semibold max-w-md mx-auto leading-relaxed">
                ℹ️ Ce service est destiné en priorité aux logements disposant d'un DPE réalisé après le 1er juillet 2021.
              </p>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-white">
              <h3 className="text-xl font-bold text-slate-800 text-center mb-8">Avez-vous fait réaliser un <DpeTooltip /> après le 1er Juillet 2021 ?</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <button onClick={() => handleDpeCheck(false)} className="px-8 py-4 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold transition-all hover:border-enedis-bright hover:text-enedis-bright">Non / Je ne sais pas</button>
                <button onClick={() => handleDpeCheck(true)} className="px-8 py-4 bg-enedis-bright text-white rounded-2xl hover:bg-enedis-blue font-bold shadow-lg shadow-enedis-bright/20 transition-all transform hover:-translate-y-1">Oui, j'ai mon DPE</button>
              </div>
              <div className="border-t border-slate-50 pt-8 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Vous êtes un professionnel ou un chercheur ?</p>
                <button onClick={openDashboard} className="inline-flex items-center gap-2 px-6 py-3 border border-enedis-bright/30 text-enedis-bright rounded-xl hover:bg-enedis-bright/5 transition-all font-bold text-sm"><span>📊</span> Accéder à l'Observatoire Territorial</button>
              </div>
            </div>
          </div>
        )}
        {step === Step.NO_DPE && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <button onClick={resetApp} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-enedis-bright transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              Retour
            </button>
            <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-white text-center">
              <div className="w-20 h-20 bg-enedis-bright/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <span className="text-4xl">🏠</span>
              </div>
              <h2 className="text-2xl font-black text-enedis-title mb-4 uppercase tracking-tight">Estimez votre DPE en ligne</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-4 max-w-md mx-auto">
                Pas de DPE récent ? Pas de souci ! Vous pouvez obtenir une <strong className="text-slate-700">estimation gratuite</strong> de votre Diagnostic de Performance Énergétique directement en ligne.
              </p>
              <p className="text-slate-500 font-medium leading-relaxed mb-10 max-w-md mx-auto">
                Le site <strong className="text-enedis-bright">Des Ptites Economies</strong> vous propose un outil simple et rapide pour estimer la performance énergétique de votre logement.
              </p>
              <a
                href="https://desptiteseconomies.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-5 bg-enedis-bright text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-enedis-bright/30 hover:bg-enedis-blue hover:-translate-y-1 transition-all"
              >
                Estimer mon DPE
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
              <p className="text-[10px] text-slate-300 font-bold mt-6">Vous serez redirigé vers desptiteseconomies.fr</p>
            </div>
          </div>
        )}
        {step === Step.ADDRESS_SELECT && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <button onClick={resetApp} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-enedis-bright transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              Retour
            </button>
            <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-white">
              <h2 className="text-2xl font-black text-slate-800 mb-8 text-center uppercase tracking-tight">Retrouvez votre logement</h2>
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Département</label>
                  <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedCity(''); setSelectedAddressId(''); }} className="block w-full pl-4 pr-10 py-4 text-base border-slate-100 focus:outline-none focus:ring-2 focus:ring-enedis-bright/20 focus:border-enedis-bright sm:text-sm rounded-2xl border bg-slate-50 transition-all font-medium">
                    <option value="">Sélectionner un département</option>
                    {departments.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
                  </select>
                </div>
                <div className={!selectedDept ? 'opacity-40' : ''}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ville (Facultatif)</label>
                  <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedAddressId(''); }} disabled={!selectedDept} className="block w-full pl-4 pr-10 py-4 text-base border-slate-100 focus:outline-none focus:ring-2 focus:ring-enedis-bright/20 focus:border-enedis-bright sm:text-sm rounded-2xl border bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all font-medium">
                    <option value="">Toutes les villes</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div className={!selectedDept ? 'opacity-40' : ''}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Adresse exacte</label>
                  <AddressAutocomplete department={selectedDept} city={selectedCity} disabled={!selectedDept} onSelect={(id) => setSelectedAddressId(id)} />
                </div>
                <button type="submit" disabled={!selectedAddressId} className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-lg shadow-enedis-bright/20 text-sm font-black uppercase tracking-widest text-white bg-enedis-bright hover:bg-enedis-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-enedis-bright transition-all disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed mt-8">
                  Analyser mon logement
                </button>
              </form>
            </div>
          </div>
        )}
        {step === Step.LOADING && (
          <div className="flex flex-col items-center justify-center h-96 animate-fade-in max-w-2xl mx-auto">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-enedis-bright/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-enedis-bright border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-black text-slate-800 mt-8 uppercase tracking-tight">Récupération des données DPE...</h3>
            <p className="text-sm text-slate-400 mt-2 font-medium">Interrogation de la base ADEME en cours</p>
          </div>
        )}
        {step === Step.RESULTS && metrics && houseData && (
          <div className="animate-fade-in max-w-4xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-white p-8 rounded-3xl border border-white shadow-xl shadow-slate-200/40 gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Votre Logement</h2>
                <p className="text-slate-400 font-bold text-sm mt-1">{addressData?.street}, {addressData?.city}</p>
                <div className="flex gap-8 mt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Classe DPE</span>
                    <span className={`text-3xl font-black ${['A','B'].includes(houseData.dpe) ? 'text-enedis-green' : ['C','D'].includes(houseData.dpe) ? 'text-yellow-500' : 'text-red-500'}`}>{houseData.dpe}</span>
                  </div>
                  <div className="w-px bg-slate-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Classe GES</span>
                    <span className={`text-3xl font-black ${['A','B'].includes(houseData.ges || '') ? 'text-enedis-green' : ['C','D'].includes(houseData.ges || '') ? 'text-yellow-500' : 'text-red-500'}`}>{houseData.ges || 'N/A'}</span>
                  </div>
                  <div className="w-px bg-slate-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Conso. Annuelle</span>
                    <span className="text-3xl font-black text-slate-800">{houseData.consumption.toLocaleString()} <span className="text-xs font-bold text-slate-300 uppercase">kWh</span></span>
                  </div>
                </div>
                {houseData.numeroDpe && houseData.numeroDpe !== 'N/A' && (
                  <p className="text-[10px] text-slate-400 font-bold mt-3">N° DPE : {houseData.numeroDpe}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                 <div className="flex items-center gap-4">
                   <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                    <button onClick={() => setIsExpertMode(false)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isExpertMode ? 'bg-enedis-bright text-white shadow-md shadow-enedis-bright/20' : 'text-slate-400 hover:text-enedis-bright'}`}>Simple</button>
                    <button onClick={() => setIsExpertMode(true)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isExpertMode ? 'bg-enedis-bright text-white shadow-md shadow-enedis-bright/20' : 'text-slate-400 hover:text-enedis-bright'}`}>Expert</button>
                  </div>
                  <button onClick={() => generatePDFReport(metrics, houseData, addressData)} className="p-3.5 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-enedis-bright hover:border-enedis-bright transition-all shadow-sm" title="Télécharger le rapport PDF">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                </div>
                <button onClick={resetApp} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-enedis-bright transition-colors border-b border-slate-100 pb-1">Nouvelle recherche</button>
              </div>
            </div>

            <div className="transition-all duration-500">
              {isExpertMode ? (
                <ExpertView metrics={metrics} userAddress={addressData} onOpenDashboard={openDashboard} />
              ) : (
                <SimpleView metrics={metrics} userAddress={addressData} />
              )}
            </div>
          </div>
        )}
      </main>
      <footer className="bg-white border-t border-slate-100 mt-auto py-12 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">&copy; 2024 Watt About You par Energeeks</p>
        <p className="text-[10px] font-bold text-slate-300 mt-2">Données DPE issues de l'ADEME (Simulation temps réel)</p>
      </footer>
    </div>
  );
};

export default App;
