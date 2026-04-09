
import { DPEGroup, ComparisonMetrics, AddressData, HouseData, HousingGroup, HousingUnitPoint, BoxPlotPoint, DistributionBin } from '../types';

export let isDataLoaded = false;
let REAL_DB: Record<string, { addresses: AddressData[] }> = {};
let HOUSE_DB: Record<string, HouseData> = {};
// Store all (address, house) pairs for housing group/unit lookups
let ALL_DATA: { address: AddressData; house: HouseData }[] = [];

export const initData = async () => {
    if (isDataLoaded) return;
    try {
        console.log("Loading dataset...");
        // @ts-ignore
        const res = await fetch(`${import.meta.env.BASE_URL}light_data.json`);
        const data = await res.json();
        
        REAL_DB = {};
        HOUSE_DB = {};
        ALL_DATA = [];
        
        data.forEach((item: any) => {
            const addr: AddressData = item.address;
            if (addr.zipCode) {
                addr.zipCode = String(addr.zipCode).split('.')[0];
            }
            const house: HouseData = item.house;
            
            if (!REAL_DB[addr.department]) {
                REAL_DB[addr.department] = { addresses: [] };
            }
            REAL_DB[addr.department].addresses.push(addr);
            HOUSE_DB[addr.id] = house;
            ALL_DATA.push({ address: addr, house });
        });
        
        console.log(`Loaded ${data.length} records.`);
        isDataLoaded = true;
    } catch (e) {
        console.error("Failed to load true data", e);
    }
};

export const getDepartments = () => {
    return Object.keys(REAL_DB)
        .filter(code => code !== 'nan' && code !== 'NaN')
        .sort()
        .map(code => ({ 
            code, 
            name: code === '91' ? 'Essonne' : `Département ${code}` 
        }));
};

export const getCities = (deptCode: string) => {
  if (!REAL_DB[deptCode]) return [];
  const cities = new Set(REAL_DB[deptCode].addresses.map(a => a.city));
  return Array.from(cities).sort();
};

export const searchAddresses = (query: string, deptCode: string, city: string): AddressData[] => {
  if (!query) return [];
  let candidates: AddressData[] = [];
  if (deptCode && REAL_DB[deptCode]) {
    candidates = REAL_DB[deptCode].addresses;
  } else {
    Object.values(REAL_DB).forEach(entry => {
      candidates = [...candidates, ...entry.addresses];
    });
  }
  if (city) {
    candidates = candidates.filter(a => a.city === city);
  }
  const lowerQuery = query.toLowerCase();
  
  // Custom scorer to sort by best match
  const scored = candidates.map(a => {
    const sStr = a.street.toLowerCase();
    const cStr = a.city.toLowerCase();
    let score = 0;
    if (sStr.includes(lowerQuery)) score += 10;
    if (sStr.startsWith(lowerQuery)) score += 5;
    if (cStr.includes(lowerQuery)) score += 2;
    return { item: a, score };
  }).filter(x => x.score > 0);
  
  return scored.sort((a, b) => b.score - a.score).map(x => x.item).slice(0, 20);
};

export const getAddressDetails = (addressId: string): AddressData | undefined => {
  for (const deptKey in REAL_DB) {
    const found = REAL_DB[deptKey].addresses.find(a => a.id === addressId);
    if (found) return found;
  }
  return undefined;
};

export const fetchHouseData = (addressId: string): HouseData => {
  if (HOUSE_DB[addressId]) {
      // It's already in our JSON
      return HOUSE_DB[addressId];
  }
  
  // Fallback to mock just in case
  const idNum = parseInt(addressId.replace(/[^0-9]/g, '') || "1");
  const dpeValues = Object.values(DPEGroup);
  const dpe = dpeValues[(idNum * 2) % dpeValues.length]; 
  const surface = 60 + (idNum * 12);
  const consumptionBase = (3200 + (idNum * 450)) * (surface / 100);
  const variability = 0.8 + (Math.random() * 0.4); 
  const consumption = consumptionBase * variability;
  
  return {
    dpe,
    ges: 'N/A',
    numeroDpe: 'N/A',
    consumption: Math.round(consumption),
    surface,
    year: 1960 + (idNum * 7)
  };
};

// ── Helper: compute percentile from a sorted array ──
const computePercentile = (sortedArr: number[], p: number): number => {
  if (sortedArr.length === 0) return 0;
  const k = (sortedArr.length - 1) * p / 100;
  const f = Math.floor(k);
  const c = Math.min(f + 1, sortedArr.length - 1);
  return sortedArr[f] + (k - f) * (sortedArr[c] - sortedArr[f]);
};

export const calculateMetrics = (userConsumption: number, userDpe: DPEGroup, userSurface: number = 90, userClusterLabel?: string): ComparisonMetrics => {
  // ── Get all houses in the user's cluster ──
  const clusterHouses = Object.values(HOUSE_DB)
    .filter(h => h.clusterLabel && h.clusterLabel === userClusterLabel && h.consumption > 0 && h.surface > 0);

  let absoluteConsos = clusterHouses.map(h => h.consumption);

  if (absoluteConsos.length === 0) {
    // Fallback if the cluster label is not set or not enough data
    absoluteConsos = Object.values(HOUSE_DB)
      .filter(h => h.dpe === userDpe && h.consumption > 0)
      .map(h => h.consumption);
  }

  let median = 0;
  let mean = 0;

  if (absoluteConsos.length > 0) {
    absoluteConsos.sort((a, b) => a - b);
    const mid = Math.floor(absoluteConsos.length / 2);
    median = absoluteConsos.length % 2 !== 0 ? absoluteConsos[mid] : (absoluteConsos[mid - 1] + absoluteConsos[mid]) / 2;
    mean = Math.round(absoluteConsos.reduce((a, b) => a + b, 0) / absoluteConsos.length);
  } else {
    // Fallback if no data is loaded yet
    const BASE_KWH_M2 = { A: 45, B: 80, C: 130, D: 210, E: 300, F: 400, G: 550 };
    const PE_TO_FE = 2.3; // Primary energy to Final energy conversion
    const medianKwhM2 = BASE_KWH_M2[userDpe] / PE_TO_FE;
    median = Math.round(userSurface * medianKwhM2);
    mean = Math.round(median * 1.05);
  }

  const diffPct = ((userConsumption - median) / median) * 100;
  
  let betterThan = 50;
  let dynamicPercentile = 50;

  if (absoluteConsos.length > 0) {
    const countWorse = absoluteConsos.filter(c => c > userConsumption).length;
    betterThan = Math.round((countWorse / absoluteConsos.length) * 100);
    dynamicPercentile = 100 - betterThan;
    
    betterThan = Math.max(1, Math.min(99, betterThan));
    dynamicPercentile = Math.max(1, Math.min(99, dynamicPercentile));
  } else {
    dynamicPercentile = Math.min(99, Math.max(1, 50 + (diffPct * 1.2)));
    betterThan = Math.round(100 - dynamicPercentile);
  }

  const annualCO2 = (userConsumption * 0.06); 
  const treesEquivalent = Math.round(annualCO2 / 25);

  // ── Distribution: real histogram from cluster consumption ──
  const clusterConsos = clusterHouses.map(h => h.consumption).sort((a, b) => a - b);
  const distribution = [];
  const binCount = 18;

  if (clusterConsos.length > 0) {
    // Use P5-P95 range to avoid extreme outliers stretching the bins,
    // but ensure the user's consumption is always within range
    let histMin = computePercentile(clusterConsos, 5);
    let histMax = computePercentile(clusterConsos, 95);
    if (userConsumption < histMin) histMin = userConsumption;
    if (userConsumption >= histMax) histMax = userConsumption + 1;
    const binSize = Math.max(1, Math.round((histMax - histMin) / binCount));
    
    for (let i = 0; i < binCount; i++) {
      const rangeStart = Math.round(histMin + i * binSize);
      const rangeEnd = Math.round(histMin + (i + 1) * binSize);
      const count = clusterConsos.filter(c => c >= rangeStart && c < rangeEnd).length;
      const isUserBin = userConsumption >= rangeStart && userConsumption < rangeEnd;
      distribution.push({ rangeStart, rangeEnd, count, isUserBin });
    }
  } else {
    // Fallback with simple bins
    const binSize = Math.round((median * 1.8) / binCount);
    for (let i = 0; i < binCount; i++) {
      const rangeStart = i * binSize;
      distribution.push({
        rangeStart: Math.round(rangeStart),
        rangeEnd: Math.round(rangeStart + binSize),
        count: 0,
        isUserBin: userConsumption >= rangeStart && userConsumption < rangeStart + binSize
      });
    }
  }

  // ── Box plot: real quartiles per DPE class from all HOUSE_DB ──
  const DPE_COLORS: Record<string, string> = {
    A: '#009640', B: '#52B13C', C: '#95C11F', D: '#F4E500',
    E: '#F0B500', F: '#E67D24', G: '#E30613'
  };
  const boxPlotData: BoxPlotPoint[] = Object.values(DPEGroup).map(dpeClass => {
    const vals = Object.values(HOUSE_DB)
      .filter(h => h.dpe === dpeClass && h.consumption > 0 && h.surface > 0)
      .map(h => h.consumption / h.surface)
      .sort((a, b) => a - b);

    if (vals.length > 0) {
      return {
        class: dpeClass,
        min: Math.round(computePercentile(vals, 5)),   // P5 to avoid extreme outliers
        q1: Math.round(computePercentile(vals, 25)),
        median: Math.round(computePercentile(vals, 50)),
        q3: Math.round(computePercentile(vals, 75)),
        max: Math.round(computePercentile(vals, 95)),   // P95 to avoid extreme outliers
        color: DPE_COLORS[dpeClass]
      };
    }
    return { class: dpeClass, min: 0, q1: 0, median: 0, q3: 0, max: 0, color: DPE_COLORS[dpeClass] };
  });

  // ── Cluster characteristics: real stats from cluster ──
  const clusterSurfaces = clusterHouses.map(h => h.surface).sort((a, b) => a - b);
  const clusterYears = clusterHouses.map(h => h.year).filter(y => y > 0).sort((a, b) => a - b);
  const medianSurface = clusterSurfaces.length > 0 ? Math.round(computePercentile(clusterSurfaces, 50)) : userSurface;
  const medianYear = clusterYears.length > 0 ? Math.round(computePercentile(clusterYears, 50)) : 1980;
  const yearMin = clusterYears.length > 0 ? Math.round(computePercentile(clusterYears, 10)) : 1960;
  const yearMax = clusterYears.length > 0 ? Math.round(computePercentile(clusterYears, 90)) : 2000;
  const clusterName = userClusterLabel || 'Inconnu';
  // Extract dominant energy from cluster label (e.g. "Gaz_Gaz_Variante_1" → "Gaz")
  const dominantEnergy = clusterName.split('_')[0] || 'Non spécifié';

  const clusterCharacteristics = [
    `Cluster : ${clusterName}`,
    `Énergie dominante : ${dominantEnergy}`,
    `Surface habitable médiane : ${medianSurface}m²`,
    `Période de construction : ${yearMin} - ${yearMax} (médiane ${medianYear})`,
    `Nombre de logements dans le cluster : ${clusterHouses.length}`,
    `Consommation médiane : ${median} kWh/an`,
    `Performance théorique : Classe ${userDpe}`
  ];

  // ── Usage distribution (not available in CSV, kept as reference values) ──
  const usageDistribution = [
    { name: 'Chauffage', value: 62, color: '#132F8D' },
    { name: 'Eau Chaude', value: 12, color: '#1423DC' },
    { name: 'Appareils', value: 18, color: '#95C11F' },
    { name: 'Cuisson', value: 5, color: '#E67D24' },
    { name: 'Éclairage', value: 3, color: '#F4E500' },
  ];

  // ── DPE distribution: real counts from user's cluster ──
  const dpeCounts: Record<string, number> = {};
  Object.values(DPEGroup).forEach(d => { dpeCounts[d] = 0; });
  clusterHouses.forEach(h => { if (dpeCounts[h.dpe] !== undefined) dpeCounts[h.dpe]++; });
  const totalInCluster = clusterHouses.length || 1;
  const dpeDistribution = Object.values(DPEGroup).map(dpeClass => ({
    class: dpeClass,
    count: dpeCounts[dpeClass],
    percentage: Math.round((dpeCounts[dpeClass] / totalInCluster) * 100),
    color: DPE_COLORS[dpeClass]
  }));

  // ── Scatter data: real (surface, consumption) from cluster ──
  const maxScatterPoints = 60;
  const scatterSource = clusterHouses.length > maxScatterPoints
    ? clusterHouses.filter((_, i) => i % Math.ceil(clusterHouses.length / maxScatterPoints) === 0).slice(0, maxScatterPoints)
    : clusterHouses;
  const scatterData = scatterSource.map(h => ({
    surface: h.surface,
    consumption: h.consumption,
    isUser: false
  }));

  return {
    userConsumption,
    userSurface,
    userYear: medianYear,
    groupMean: mean,
    groupMedian: median,
    percentile: dynamicPercentile,
    betterThanPercentage: betterThan,
    differencePercentage: diffPct,
    totalSimilarHouseholds: clusterHouses.length,
    distribution,
    dpeDistribution,
    scatterData,
    usageDistribution,
    boxPlotData,
    clusterCharacteristics,
    dpeGroup: userDpe,
    radarData: [],
    co2Tons: annualCO2 / 1000,
    treesEquivalent
  };
};

// ── Housing groups: built from real cluster labels ──
const CLUSTER_COLORS: Record<string, string> = {
  'Gaz_Gaz_Variante_1': '#3b82f6', // Blue
  'Gaz_Gaz_Variante_2': '#0ea5e9', // Light Blue
  'Gaz_Gaz_Variante_3': '#06b6d4', // Cyan
  'Gaz_Gaz_Standard_1': '#6366f1', // Indigo
  'Gaz_Gaz_Standard_2': '#8b5cf6', // Violet
  'Gaz_Gaz_Standard_3': '#a855f7', // Purple
  'Gaz_Gaz_Atypique_1': '#d946ef', // Fuchsia
  'Gaz_Gaz_Atypique_2': '#ec4899', // Pink
  'Gaz_Gaz_Atypique_3': '#f43f5e', // Rose

  'Électricité_Électricité_Variante_1': '#eab308', // Yellow
  'Électricité_Électricité_Variante_2': '#f59e0b', // Amber
  'Électricité_Électricité_Variante_3': '#f97316', // Orange
  'Électricité_Électricité_Standard_1': '#fbbf24', // Lighter Yellow
  'Électricité_Électricité_Standard_2': '#fb923c', // Lighter Orange
  'Électricité_Électricité_Standard_3': '#fde047', // Even Lighter Yellow
  'Électricité_Électricité_Atypique_1': '#f9a8d4', // Light Pink
  'Électricité_Électricité_Atypique_2': '#fbcfe8', // Lighter Pink
  'Électricité_Électricité_Atypique_3': '#fdf2f8', // Very Light Pink

  'Réseau_Réseau_Variante_1': '#22c55e', // Green
  'Réseau_Réseau_Variante_2': '#10b981', // Emerald
  'Réseau_Réseau_Variante_3': '#14b8a6', // Teal
  'Réseau_Réseau_Standard_1': '#4ade80', // Light Green
  'Réseau_Réseau_Standard_2': '#34d399', // Light Emerald
  'Réseau_Réseau_Standard_3': '#2dd4bf', // Light Teal
  'Réseau_Réseau_Atypique_1': '#86efac', // Extra Light Green
  'Réseau_Réseau_Atypique_2': '#6ee7b7', // Extra Light Emerald
  'Réseau_Réseau_Atypique_3': '#5eead4', // Extra Light Teal
};

const getClusterColor = (label: string): string => {
    if (CLUSTER_COLORS[label]) return CLUSTER_COLORS[label];
    
    // Fallback: stable hash-based color
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
};

export const getHousingGroups = (): HousingGroup[] => {
  // Group all houses by clusterLabel
  const groups: Record<string, HouseData[]> = {};
  Object.values(HOUSE_DB).forEach(h => {
    const label = h.clusterLabel || 'Unknown';
    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  return Object.entries(groups)
    .filter(([label]) => label !== 'Unknown')
    .map(([label, houses]) => {
      const validHouses = houses.filter(h => h.consumption > 0);
      const avgConso = validHouses.length > 0
        ? Math.round(validHouses.reduce((s, h) => s + h.consumption, 0) / validHouses.length)
        : 0;

      // Find dominant DPE
      const dpeCounts: Record<string, number> = {};
      houses.forEach(h => { dpeCounts[h.dpe] = (dpeCounts[h.dpe] || 0) + 1; });
      const dominantDpe = (Object.entries(dpeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'D') as DPEGroup;

      return {
        id: label,
        name: label.replace(/_/g, ' '),
        description: `Cluster ${label}`,
        avgConsumption: avgConso,
        housingCount: houses.length,
        dominantDPE: dominantDpe,
        color: getClusterColor(label)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getHousingUnitsForGroup = (groupId: string | 'all'): HousingUnitPoint[] => {
    const groups = getHousingGroups();
    const targetLabels = groupId === 'all'
      ? groups.map(g => g.id)
      : groups.filter(g => g.id === groupId).map(g => g.id);

    const colorMap: Record<string, string> = {};
    groups.forEach(g => { colorMap[g.id] = g.color; });

    // Sample real data points with their actual lat/lng
    const maxPerGroup = groupId === 'all' ? 10 : 20;
    let points: HousingUnitPoint[] = [];

    targetLabels.forEach(label => {
      const matching = ALL_DATA.filter(d => d.house.clusterLabel === label && d.address.lat && d.address.lng);
      const sampled = matching.length > maxPerGroup
        ? matching.filter((_, i) => i % Math.ceil(matching.length / maxPerGroup) === 0).slice(0, maxPerGroup)
        : matching;

      sampled.forEach((d, i) => {
        points.push({
          id: `${label}-${i}`,
          groupId: label,
          lat: d.address.lat,
          lng: d.address.lng,
          color: getClusterColor(label),
          dpe: d.house.dpe as DPEGroup
        });
      });
    });

    return points;
};

// ── Bottom 75% distribution: histogram of the 75% lowest consumers ──
export const getBottom90Distribution = (
  clusterLabel: string,
  userConsumption: number
): DistributionBin[] | null => {
  const allConsos = Object.values(HOUSE_DB)
    .filter(h => h.clusterLabel === clusterLabel && h.consumption > 0)
    .map(h => h.consumption)
    .sort((a, b) => a - b);

  if (allConsos.length === 0) return null;

  // Find P75 cutoff
  const p75 = computePercentile(allConsos, 75);

  // If user is NOT in the bottom 75%, return null
  if (userConsumption > p75) return null;

  // Filter to bottom 75%
  const bottom75 = allConsos.filter(c => c <= p75);
  if (bottom75.length === 0) return null;

  const binCount = 18;
  const histMin = bottom75[0];
  const histMax = bottom75[bottom75.length - 1];
  const binSize = Math.max(1, Math.round((histMax - histMin) / binCount));
  const bins: DistributionBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const rangeStart = Math.round(histMin + i * binSize);
    const rangeEnd = Math.round(histMin + (i + 1) * binSize);
    const count = bottom75.filter(c => c >= rangeStart && c < rangeEnd).length;
    const isUserBin = userConsumption >= rangeStart && userConsumption < rangeEnd;
    bins.push({ rangeStart, rangeEnd, count, isUserBin });
  }

  return bins;
};

