import React, { useState } from 'react';

const SimilarHousingInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Qu'est-ce qu'un "logement similaire" ?
        </span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="p-5 bg-white text-sm text-gray-600 space-y-4 border-t border-gray-200">
          <p>
            Les logements similaires sont regroupés en <strong>"clusters"</strong> à l'aide d'un algorithme d'apprentissage automatique. Ce clustering repose sur un ensemble de caractéristiques réelles extraites de la base DPE de l'ADEME :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-black text-enedis-bright uppercase tracking-wider mb-2 flex items-center gap-2">
                🏗️ Caractéristiques du bâti
              </h4>
              <ul className="space-y-1 text-[12px] text-slate-600">
                <li>• Type de bâtiment (maison, appartement...)</li>
                <li>• Période de construction</li>
                <li>• Nombre de niveaux du logement</li>
                <li>• Logement traversant ou non</li>
                <li>• Présence de panneaux photovoltaïques</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-black text-enedis-bright uppercase tracking-wider mb-2 flex items-center gap-2">
                🧱 Qualité de l'isolation
              </h4>
              <ul className="space-y-1 text-[12px] text-slate-600">
                <li>• Isolation des murs</li>
                <li>• Isolation des menuiseries (fenêtres)</li>
                <li>• Isolation du plancher bas</li>
                <li>• Protection solaire extérieure</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-black text-enedis-bright uppercase tracking-wider mb-2 flex items-center gap-2">
                🔥 Chauffage & Eau chaude
              </h4>
              <ul className="space-y-1 text-[12px] text-slate-600">
                <li>• Type d'installation de chauffage</li>
                <li>• Type d'installation d'eau chaude sanitaire</li>
                <li>• Type de générateur principal (chaudière, PAC...)</li>
                <li>• Type d'émetteurs (radiateurs, plancher chauffant...)</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-black text-enedis-bright uppercase tracking-wider mb-2 flex items-center gap-2">
                📐 Dimensions du logement
              </h4>
              <ul className="space-y-1 text-[12px] text-slate-600">
                <li>• Surface habitable</li>
                <li>• Hauteur sous plafond</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            💡 En complément, les descriptions techniques détaillées des installations de chauffage et d'eau chaude (type exact de générateur, d'émetteurs, etc.) sont analysées par un modèle de traitement du langage (SBERT) pour affiner les regroupements. Cette approche permet de comparer votre consommation à des logements partageant des caractéristiques physiques et techniques très proches du vôtre.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimilarHousingInfo;