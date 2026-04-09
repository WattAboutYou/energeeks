
import React, { useState, useEffect, useRef } from 'react';
import { AddressData } from '../types';
import { searchAddresses } from '../services/dataService';

interface AddressAutocompleteProps {
  department: string;
  city: string;
  onSelect: (addressId: string) => void;
  disabled?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ department, city, onSelect, disabled }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Reset if context changes
  useEffect(() => {
    setQuery('');
    setSelectedDisplay('');
    setSuggestions([]);
  }, [department, city]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedDisplay(''); // clear selection if user types
    
    if (val.length >= 2) {
      const results = searchAddresses(val, department, city);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (address: AddressData) => {
    setQuery(address.street);
    setSelectedDisplay(`${address.street}, ${address.city}`);
    setShowSuggestions(false);
    onSelect(address.id);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={selectedDisplay || query}
          onChange={handleInputChange}
          onFocus={() => {
              if(query.length >= 2) setShowSuggestions(true);
          }}
          disabled={disabled}
          placeholder={disabled ? "Sélectionnez une ville d'abord" : "Commencez à taper votre adresse..."}
          className={`block w-full pl-11 pr-4 py-4 text-base border-slate-100 focus:outline-none focus:ring-2 focus:ring-enedis-bright/20 focus:border-enedis-bright sm:text-sm rounded-2xl border transition-all font-medium ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-slate-50 text-slate-800'}`}
          autoComplete="off"
        />
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className={`h-5 w-5 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full bg-white shadow-2xl max-h-60 rounded-2xl py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-slate-50">
          {suggestions.map((address) => (
            <li
              key={address.id}
              onClick={() => handleSelect(address)}
              className="cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-slate-50 text-slate-900 border-b border-slate-50 last:border-0 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 truncate">{address.street}</span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">{address.city} ({address.zipCode})</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && (
         <div className="absolute z-50 mt-2 w-full bg-white shadow-xl rounded-2xl py-4 px-5 text-xs text-slate-400 border border-slate-100 italic font-medium">
            Aucune adresse trouvée pour "{query}"
         </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
