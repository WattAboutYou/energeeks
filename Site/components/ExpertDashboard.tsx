import React, { useState, useEffect, useMemo } from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { HousingGroup, HousingUnitPoint } from '../types';
import { getHousingGroups, getHousingUnitsForGroup } from '../services/dataService';

interface ExpertDashboardProps {
  onBack: () => void;
}

const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ onBack }) => {
  const [groups, setGroups] = useState<HousingGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [mapPoints, setMapPoints] = useState<HousingUnitPoint[]>([]);
  
  // Default center (Approx center of Essonne)
  const [center, setCenter] = useState<[number, number]>([48.55, 2.35]);
  const [zoom, setZoom] = useState(10);

  // Load Groups Initial Data
  useEffect(() => {
    const data = getHousingGroups();
    setGroups(data);
  }, []);

  // Update Points when selection changes
  useEffect(() => {
    const points = getHousingUnitsForGroup(selectedGroupId);
    setMapPoints(points);
  }, [selectedGroupId]);

  const handleGroupSelect = (id: string) => {
    setSelectedGroupId(id);
    // Optional: Recenter map if needed, but for "all" vs "group" we might just keep view
    if (id === 'all') {
        setZoom(10);
        setCenter([48.55, 2.35]);
    } else {
        // Zoom in slightly when selecting a specific group to see details
        setZoom(11); 
    }
  };

  const selectedGroupDetails = useMemo(() => 
    groups.find(g => g.id === selectedGroupId), 
  [groups, selectedGroupId]);

  // Total stats for current view
  const currentStats = useMemo(() => {
    const targetGroups = selectedGroupId === 'all' ? groups : (selectedGroupDetails ? [selectedGroupDetails] : []);
    const totalHousing = targetGroups.reduce((acc, g) => acc + g.housingCount, 0);
    const avgConsumption = Math.round(targetGroups.reduce((acc, g) => acc + (g.avgConsumption * g.housingCount), 0) / totalHousing) || 0;
    return { totalHousing, avgConsumption };
  }, [groups, selectedGroupId, selectedGroupDetails]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm z-20 relative">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-enedis-blue hover:text-enedis-bright px-3 py-2 rounded transition-colors text-sm font-bold uppercase tracking-wide border border-transparent hover:border-blue-100"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Retour
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <span className="text-enedis-title">Watt About You</span> 
                    <span className="text-gray-400 font-light">|</span>
                    <span className="text-enedis-title">Observatoire</span>
                </h1>
            </div>
        </div>
        
        {/* Filter Dropdown in Header */}
        <div className="flex items-center gap-4">
            <div className="relative">
                <select 
                    value={selectedGroupId}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-enedis-blue text-sm font-medium shadow-sm w-64 hover:border-enedis-blue"
                >
                    <option value="all">Tous les groupes (Vue globale)</option>
                    {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
            <span className="text-xs font-semibold bg-enedis-green text-white px-3 py-1 rounded-full shadow-sm hidden sm:block">Essonne (91)</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Legend */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-xl absolute md:relative h-full transform transition-transform duration-300 ease-in-out md:translate-x-0">
            
            {/* Global Stats Card */}
            <div className="p-6 bg-gradient-to-br from-enedis-light to-white border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    {selectedGroupId === 'all' ? "Synthèse Globale" : "Détail du Groupe"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-2xl font-bold text-enedis-blue">{currentStats.totalHousing.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">Logements</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-2xl font-bold text-slate-700">{currentStats.avgConsumption.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">kWh/an (Moy.)</p>
                    </div>
                </div>
                {selectedGroupDetails && (
                    <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">
                        <p className="font-semibold text-enedis-blue mb-1">{selectedGroupDetails.name}</p>
                        <p>{selectedGroupDetails.description}</p>
                    </div>
                )}
            </div>

            {/* List as Legend */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
                <div className="p-4 sticky top-0 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Typologies (Légende)</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                    {groups.map((group) => (
                    <li 
                        key={group.id}
                        onClick={() => handleGroupSelect(group.id)}
                        className={`p-3 cursor-pointer transition-all hover:bg-white hover:shadow-md flex items-center gap-3 ${selectedGroupId === group.id ? 'bg-white border-r-4 border-r-enedis-blue shadow-sm' : 'border-r-4 border-r-transparent'}`}
                    >
                        <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: group.color }}></div>
                        <div className="flex-1">
                            <h4 className={`font-bold text-xs leading-tight ${selectedGroupId === group.id ? 'text-enedis-title' : 'text-slate-700'}`}>{group.name}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{group.housingCount} logements • Moy. {group.avgConsumption} kWh</p>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Map Visualization */}
        <div className="flex-1 relative bg-enedis-light">
          <Map 
            center={center} 
            zoom={zoom} 
            onBoundsChanged={({ center, zoom }) => { 
              setCenter(center); 
              setZoom(zoom); 
            }}
          >
            <ZoomControl />
            
            {/* Render Individual Housing Units */}
            {mapPoints.map(point => (
              <Marker 
                key={point.id}
                width={12}
                anchor={[point.lat, point.lng]}
                color={point.color}
                className="opacity-80 hover:opacity-100 hover:scale-125 transition-all duration-200 cursor-crosshair"
                onClick={() => {
                    // Could add popup logic here
                    console.log("Clicked housing unit", point.id);
                }}
              />
            ))}
          </Map>
            
          {/* Floating badge for context on Map */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 text-xs font-medium text-slate-700 z-10 pointer-events-none">
             {selectedGroupId === 'all' 
                ? `${mapPoints.length} logements affichés (Vue dispersée)` 
                : `${mapPoints.length} logements du groupe "${selectedGroupDetails?.name}"`}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ExpertDashboard;