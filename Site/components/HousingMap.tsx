import React from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { AddressData } from '../types';

interface HousingMapProps {
  userAddress: AddressData | undefined;
}

const HousingMap: React.FC<HousingMapProps> = ({ userAddress }) => {
  if (!userAddress) return null;

  // Generate fake neighbors around the user
  const generateNeighbors = (centerLat: number, centerLng: number) => {
    const neighbors = [];
    for (let i = 0; i < 5; i++) {
      neighbors.push({
        lat: centerLat + (Math.random() - 0.5) * 0.01,
        lng: centerLng + (Math.random() - 0.5) * 0.01,
        id: `neighbor-${i}`
      });
    }
    return neighbors;
  };

  const neighbors = generateNeighbors(userAddress.lat, userAddress.lng);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-bold text-enedis-title">Localisation et voisinage</h3>
        <span className="text-xs bg-blue-50 text-enedis-blue border border-blue-100 px-2 py-1 rounded">
          {neighbors.length} logements similaires détectés à proximité
        </span>
      </div>
      
      <div className="h-64 rounded-lg overflow-hidden border border-gray-200 relative z-0">
        <Map 
          height={256} 
          defaultCenter={[userAddress.lat, userAddress.lng]} 
          defaultZoom={13}
        >
          <ZoomControl />
          
          {/* User Marker (Enedis Blue #132F8D) */}
          <Marker 
            width={50} 
            anchor={[userAddress.lat, userAddress.lng]} 
            color="#132F8D" 
          />
          
          {/* Neighbors Markers (Enedis Green #95C11F) */}
          {neighbors.map(n => (
            <Marker 
              key={n.id}
              width={30} 
              anchor={[n.lat, n.lng]} 
              color="#95C11F" 
            />
          ))}
        </Map>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center italic">
        * Pour des raisons de confidentialité, les positions des logements similaires sont approximatives.
      </p>
    </div>
  );
};

export default HousingMap;