import React from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onLogoClick} title="Retour à l'accueil">
            <div className="w-8 h-8 bg-gradient-to-br from-enedis-blue to-enedis-bright rounded-full flex items-center justify-center shadow-sm relative overflow-hidden">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-enedis-title">
                Watt About You <span className="font-light text-slate-500 text-sm block sm:inline sm:ml-2 text-current opacity-70">par les Energeeks</span>
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;