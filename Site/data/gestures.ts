import { DPEGroup } from '../types';

export type GestureEffort = 'faible' | 'moyen';
export type GestureImpact = 'modere' | 'significant' | 'fort';
export type GestureCategory =
  | 'chauffage'
  | 'eau-chaude'
  | 'electromenager'
  | 'eclairage'
  | 'cuisine'
  | 'numerique';

export interface Gesture {
  id: string;
  category: GestureCategory;
  title: string;
  description: string;
  effort: GestureEffort;
  impact: GestureImpact;
  economy?: string;
  economyLabel?: string;
  icon: string;
  source: 'ADEME-gestes' | 'ADEME-numerique';
  /* si défini, n'afficher que pour ces DPE */
  dpeFilter?: DPEGroup[];
  /* si true, prioritaire quand consommation > médiane */
  highConsumptionPriority?: boolean;
}

// ─── GESTES RAPIDES (effort: faible) ───────────────────────────────────────
// Source : « 10 gestes pour économiser l'énergie à la maison » — ADEME Nov. 2023

export const QUICK_GESTURES: Gesture[] = [
  {
    id: 'chauffage-1deg',
    category: 'chauffage',
    title: 'Baisser le chauffage de 1°C',
    description:
      "La température idéale est de 19°C dans les pièces de vie. Chaque degré en moins représente 7 % d'économies sur votre chauffage.",
    effort: 'faible',
    impact: 'significant',
    economy: '−7 %',
    economyLabel: 'de chauffage',
    icon: 'icon-radiateur.png',
    source: 'ADEME-gestes',
    highConsumptionPriority: true,
  },
  {
    id: 'chauffage-fermer-volets',
    category: 'chauffage',
    title: 'Fermer volets et rideaux la nuit',
    description:
      "Fermez les volets et tirez les rideaux dès la tombée de la nuit. Fermez les portes des pièces peu chauffées et posez un boudin au bas de la porte d'entrée.",
    effort: 'faible',
    impact: 'modere',
    icon: 'icon-fenetre.png',
    source: 'ADEME-gestes',
  },
  {
    id: 'chauffage-radiateurs',
    category: 'chauffage',
    title: 'Laisser la chaleur circuler',
    description:
      'Ne recouvrez pas les radiateurs et évitez les rideaux qui les masquent. Purgez-les régulièrement pour améliorer leur transmission de chaleur.',
    effort: 'faible',
    impact: 'modere',
    icon: 'icon-radiateur.png',
    source: 'ADEME-gestes',
  },
  {
    id: 'eau-chaude-douche',
    category: 'eau-chaude',
    title: 'Douche courte',
    description:
      "Pas plus d'une chanson ! Une douche courte réduit significativement votre consommation d'eau chaude, qui représente une part importante de la facture d'énergie.",
    effort: 'faible',
    impact: 'modere',
    icon: 'icon-gaz.png',
    source: 'ADEME-gestes',
  },
  {
    id: 'electromenager-30deg',
    category: 'electromenager',
    title: 'Laver le linge à 30°C',
    description:
      "Un lavage à 30°C consomme 3 fois moins d'électricité qu'à 90°C. Activez le programme Eco du lave-vaisselle pour économiser jusqu'à 45 % d'électricité.",
    effort: 'faible',
    impact: 'significant',
    economy: '3× moins',
    economyLabel: "qu'à 90°C",
    icon: 'icon-electrique.png',
    source: 'ADEME-gestes',
  },
  {
    id: 'eclairage-veilles',
    category: 'eclairage',
    title: 'Éteindre les appareils en veille',
    description:
      "Éteindre complètement (et non en veille) les appareils électriques et électroniques représente jusqu'à 10 % d'économies d'électricité hors chauffage.",
    effort: 'faible',
    impact: 'significant',
    economy: "jusqu'à −10 %",
    economyLabel: 'hors chauffage',
    icon: 'icon-electrique.png',
    source: 'ADEME-gestes',
    highConsumptionPriority: true,
  },
  {
    id: 'cuisine-casseroles',
    category: 'cuisine',
    title: 'Couvrir les casseroles',
    description:
      "Une casserole couverte réduit le temps de cuisson et économise jusqu'à 25 % d'électricité ou de gaz. Coupez les plaques électriques quelques minutes avant la fin.",
    effort: 'faible',
    impact: 'significant',
    economy: '−25 %',
    economyLabel: "d'électricité ou gaz",
    icon: 'icon-electrique.png',
    source: 'ADEME-gestes',
  },
  {
    id: 'eau-chaude-temperature',
    category: 'eau-chaude',
    title: 'Régler le chauffe-eau à 55°C',
    description:
      "C'est la température idéale : suffisante pour éviter les bactéries, sans surchauffe inutile. Isolez également le ballon et les tuyaux pour limiter les pertes.",
    effort: 'faible',
    impact: 'modere',
    icon: 'icon-gaz.png',
    source: 'ADEME-gestes',
  },
];

// ─── GESTES À FORT IMPACT (effort: moyen) ──────────────────────────────────
// Source : « 10 gestes pour économiser l'énergie à la maison » — ADEME Nov. 2023

export const HIGH_IMPACT_GESTURES: Gesture[] = [
  {
    id: 'chauffage-thermostat',
    category: 'chauffage',
    title: 'Installer un thermostat programmable',
    description:
      "Un thermostat programmable module automatiquement la température selon vos horaires (nuit, absences, week-end). C'est l'un des investissements les plus rentables pour réduire votre chauffage.",
    effort: 'moyen',
    impact: 'fort',
    economy: "jusqu'à −15 %",
    economyLabel: 'de chauffage',
    icon: 'icon-radiateur.png',
    source: 'ADEME-gestes',
    highConsumptionPriority: true,
  },
  {
    id: 'chauffage-chaudiere',
    category: 'chauffage',
    title: 'Entretenir sa chaudière chaque année',
    description:
      "L'entretien annuel est obligatoire. Une chaudière mal entretenue consomme 10 à 12 % d'énergie en plus. Un technicien vérifie les réglages et nettoie les éléments essentiels.",
    effort: 'moyen',
    impact: 'fort',
    economy: '−10 à −12 %',
    economyLabel: 'de consommation',
    icon: 'icon-radiateur.png',
    source: 'ADEME-gestes',
    dpeFilter: [DPEGroup.E, DPEGroup.F, DPEGroup.G],
    highConsumptionPriority: true,
  },
  {
    id: 'eau-chaude-reducteurs',
    category: 'eau-chaude',
    title: 'Poser des réducteurs de débit',
    description:
      "Installer des réducteurs de débit sur les robinets et dans la douche est simple et peu coûteux. Le confort reste identique mais la consommation d'eau chaude baisse sensiblement.",
    effort: 'moyen',
    impact: 'significant',
    icon: 'icon-gaz.png',
    source: 'ADEME-gestes',
  },
  {
    id: 'chauffage-purger',
    category: 'chauffage',
    title: 'Purger les radiateurs',
    description:
      "Des bulles d'air dans les radiateurs réduisent leur efficacité. Purger chaque radiateur en début de saison prend quelques minutes et améliore immédiatement la diffusion de chaleur.",
    effort: 'moyen',
    impact: 'modere',
    icon: 'icon-radiateur.png',
    source: 'ADEME-gestes',
  },
];

// ─── GESTES NUMÉRIQUE ────────────────────────────────────────────────────────
// Source : « Comment adopter la sobriété numérique ? » — ADEME Sept. 2025

export interface DigitalGesture {
  id: string;
  title: string;
  description: string;
  stat?: string;
  statLabel?: string;
}

export interface DigitalTheme {
  id: string;
  title: string;
  gestures: DigitalGesture[];
}

export const DIGITAL_THEMES: DigitalTheme[] = [
  {
    id: 'appareils',
    title: 'Vos appareils',
    gestures: [
      {
        id: 'appareils-duree-vie',
        title: 'Ne pas renouveler trop vite',
        description:
          "Passer de 2 à 4 ans d'usage pour un ordinateur ou une tablette améliore de 50 % son bilan environnemental. Ne remplacez un appareil que lorsqu'il est définitivement hors d'usage.",
        stat: '50 %',
        statLabel: "d'amélioration du bilan environnemental (2 → 4 ans)",
      },
      {
        id: 'appareils-reconditonne',
        title: 'Préférer le reconditionné',
        description:
          "Un téléphone reconditionné réduit son impact environnemental de 77 à 91 % par rapport à un neuf. Pensez aussi à la location d'ordinateur ou de téléphone auprès de professionnels.",
        stat: '−77 à 91 %',
        statLabel: "d'impact vs un neuf",
      },
      {
        id: 'appareils-batterie',
        title: 'Bien gérer la batterie',
        description:
          "Maintenez la batterie entre 20 et 80 %. Ne laissez pas le téléphone se décharger complètement ni charger toute la nuit : cela prolonge la vie de la batterie et de l'appareil.",
      },
    ],
  },
  {
    id: 'connexion',
    title: 'Votre connexion',
    gestures: [
      {
        id: 'connexion-box',
        title: 'Éteindre la box la nuit',
        description:
          "Une box consomme entre 150 et 300 kWh par an — autant qu'un réfrigérateur. L'éteindre chaque nuit et avant de sortir est l'un des gestes numériques les plus efficaces.",
        stat: '150–300 kWh/an',
        statLabel: "consommation d'une box (= un réfrigérateur)",
      },
      {
        id: 'connexion-wifi',
        title: 'Préférer le WiFi à la 4G',
        description:
          "Transférer un giga en 4G émet plus de 10 fois plus de CO₂ qu'en WiFi. Activez le WiFi dès que possible. Et si vous le pouvez, utilisez le câble Ethernet.",
        stat: '10×',
        statLabel: "moins d'empreinte carbone en WiFi vs 4G",
      },
      {
        id: 'connexion-mode-eco',
        title: "Activer le mode économie d'énergie",
        description:
          "Sur ordinateur et smartphone : réduisez la luminosité de l'écran, activez la veille automatique après 10 minutes et désactivez ce qui est inutile (géolocalisation, notifications, synchro en arrière-plan).",
      },
    ],
  },
  {
    id: 'donnees',
    title: 'Vos données',
    gestures: [
      {
        id: 'donnees-streaming',
        title: 'Streamer à la bonne résolution',
        description:
          "Divisez la résolution par 2 pour réduire l'impact carbone du streaming de 20 à 30 %. Pas besoin de 4K sur un smartphone. Et pour écouter de la musique, passez en audio seul.",
        stat: '−20 à −30 %',
        statLabel: "d'impact carbone (÷2 de résolution)",
      },
      {
        id: 'donnees-telechargement',
        title: 'Télécharger plutôt que streamer',
        description:
          'Télécharger une vidéo pour la regarder ultérieurement consomme moins de données que la diffuser en direct. Désactivez aussi la lecture automatique des vidéos dans vos applications.',
      },
      {
        id: 'donnees-nettoyage',
        title: 'Faire le ménage dans ses données',
        description:
          'Supprimez régulièrement les photos, vidéos et fichiers inutiles. Désactivez la synchronisation automatique. Évitez les doublons entre plusieurs services cloud.',
      },
    ],
  },
];

// ─── ÉTAPES SUIVANTES ────────────────────────────────────────────────────────

export interface NextStep {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  dpeFilter?: DPEGroup[];
  highConsumptionOnly?: boolean;
}

export const NEXT_STEPS: NextStep[] = [
  {
    id: 'monecowatt',
    title: 'Piloter sa consommation',
    description:
      'Monecowatt vous aide à suivre votre consommation en temps réel et à agir pendant les pics.',
    cta: 'Accéder à monecowatt.fr',
    href: 'https://monecowatt.fr',
  },
  {
    id: 'france-renov-audit',
    title: 'Faire un audit énergétique',
    description:
      'Un audit identifie précisément les travaux prioritaires pour votre logement. Recommandé pour les DPE E, F et G.',
    cta: "France Rénov'",
    href: 'https://france-renov.gouv.fr',
    dpeFilter: [DPEGroup.E, DPEGroup.F, DPEGroup.G],
  },
  {
    id: 'maprimerénov',
    title: "MaPrimeRénov'",
    description:
      "Des aides de l'État pour financer vos travaux de rénovation énergétique. Isolation, chauffage, fenêtres…",
    cta: 'Voir les aides',
    href: 'https://www.maprimerenov.gouv.fr/',
  },
];
