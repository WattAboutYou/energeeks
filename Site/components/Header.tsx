import React, { useEffect, useState } from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`bg-white sticky top-0 z-50 transition-shadow duration-200 ${
        scrolled ? 'shadow-sm border-b border-brand-surface' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="Retour à l'accueil"
          >
            <img
              src={`${import.meta.env.BASE_URL}illustrations/logos/logo-Wattaboutyou.png`}
              alt="Watt About You"
              className="h-9 w-auto"
            />
            <span
              className="hidden sm:block text-xs font-body font-medium text-slate-400 border-l border-brand-surface pl-3"
            >
              par les Energeeks
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
