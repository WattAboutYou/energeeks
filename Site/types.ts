
export enum DPEGroup {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G'
}

export enum ComparisonBase {
  SIMILAR = 'SIMILAR',
  EFFICIENT = 'EFFICIENT',
  TERRITORIAL = 'TERRITORIAL'
}

export interface AddressData {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  department: string;
  lat: number;
  lng: number;
}

export interface HouseData {
  dpe: DPEGroup;
  ges?: string;
  numeroDpe?: string;
  consumption: number;
  surface: number;
  year: number;
  clusterLabel?: string;
}

export interface DistributionBin {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  isUserBin: boolean;
}

export interface DPEDistribution {
  class: DPEGroup;
  count: number;
  percentage: number;
  color: string;
}

export interface ScatterPoint {
  surface: number;
  consumption: number;
  isUser: boolean;
}

export interface UsagePoint {
  name: string;
  value: number;
  color: string;
}

export interface BoxPlotPoint {
  class: DPEGroup;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  color: string;
}

export interface ComparisonMetrics {
  userConsumption: number;
  userSurface: number;
  userYear: number;
  groupMedian: number;
  groupMean: number;
  percentile: number;
  differencePercentage: number;
  betterThanPercentage: number;
  totalSimilarHouseholds: number;
  distribution: DistributionBin[];
  dpeDistribution: DPEDistribution[];
  scatterData: ScatterPoint[];
  usageDistribution: UsagePoint[];
  boxPlotData: BoxPlotPoint[];
  clusterCharacteristics: string[];
  dpeGroup: DPEGroup;
  radarData: any[];
  co2Tons: number;
  treesEquivalent: number;
}

export interface HousingGroup {
  id: string;
  name: string;
  description: string;
  avgConsumption: number;
  housingCount: number;
  dominantDPE: DPEGroup;
  color: string;
}

export interface HousingUnitPoint {
  id: string;
  lat: number;
  lng: number;
  color: string;
  groupId: string;
  dpe?: DPEGroup;
}
