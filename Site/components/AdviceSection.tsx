import React from 'react';
import { DPEGroup } from '../types';
import NowWatt from './NowWatt';

interface AdviceSectionProps {
  dpe: DPEGroup;
  differencePercentage: number;
  betterThan?: number;
}

const AdviceSection: React.FC<AdviceSectionProps> = ({ dpe, differencePercentage, betterThan }) => (
  <NowWatt dpe={dpe} differencePercentage={differencePercentage} betterThan={betterThan} />
);

export default AdviceSection;
