import React from 'react';
import { DPEGroup } from '../types';

interface AdviceSectionProps {
  dpe: DPEGroup;
  differencePercentage: number;
}

const AdviceSection: React.FC<AdviceSectionProps> = ({ dpe, differencePercentage }) => {
  // Logic to determine advice content
  const isEfficient = ['A', 'B'].includes(dpe);
  const isAverage = ['C', 'D'].includes(dpe);
  const isInefficient = ['E', 'F', 'G'].includes(dpe);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💡</span>
        <h3 className="text-md font-bold text-enedis-title">Conseils personnalisés</h3>
        <span className="text-xs text-gray-400 font-normal ml-auto">Source : ADEME & Enedis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advice based on DPE */}
        <div>
          <h4 className="text-sm font-semibold text-enedis-title mb-2">
            Concernant votre logement (DPE {dpe})
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isEfficient && (
              "Votre logement est très performant. Pour maintenir cette excellence, assurez-vous de bien entretenir votre système de VMC et de chauffage. Pensez aux panneaux solaires pour aller plus loin !"
            )}
            {isAverage && (
              "Votre logement a un potentiel d'amélioration. L'isolation des combles et le remplacement des fenêtres anciennes sont souvent les travaux les plus rentables pour passer en classe B."
            )}
            {isInefficient && (
              "Votre logement est énergivore. Un audit énergétique est fortement recommandé. Priorisez l'isolation globale (murs, toiture) avant de changer votre système de chauffage pour éviter le surdimensionnement."
            )}
          </p>
        </div>

        {/* Advice based on consumption */}
        <div>
          <h4 className="text-sm font-semibold text-enedis-title mb-2">
            Concernant votre usage
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {differencePercentage > 10 ? (
              "Votre consommation est élevée par rapport à vos voisins. Vérifiez vos appareils en veille, la température de consigne (19°C recommandé) et l'âge de vos équipements électroménagers."
            ) : (
              "Votre consommation est maîtrisée. Continuez les éco-gestes (programme Eco du lave-linge, dégivrage du frigo) et utilisez l'application Enedis pour suivre vos pics de consommation."
            )}
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <a href="#" className="text-sm text-enedis-blue hover:underline font-medium">
          Voir toutes les aides à la rénovation (MaPrimeRénov') →
        </a>
      </div>
    </div>
  );
};

export default AdviceSection;