'use client';

import { useState } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { Globe, Check, ChevronDown } from 'lucide-react';

const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    flag: '🇮🇳'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    flag: '🇬🇧'
  }
];

export default function CountrySelector({ className = '' }) {
  const { country, changeCountry, loading } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [changing, setChanging] = useState(false);

  const handleCountryChange = async (newCountry) => {
    if (newCountry.code === country.code) {
      setIsOpen(false);
      return;
    }

    try {
      setChanging(true);
      await changeCountry(newCountry.code);
      setIsOpen(false);
      // Reload page to refresh all data with new country
      window.location.reload();
    } catch (error) {
      console.error('Failed to change country:', error);
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Globe className="h-4 w-4 animate-spin" />
        <span className="text-sm">Detecting location...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={changing}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <span className="text-lg">{country.flag}</span>
        <span className="text-sm font-medium">{country.currency}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Select your country</div>
            {COUNTRIES.map((countryOption) => (
              <button
                key={countryOption.code}
                onClick={() => handleCountryChange(countryOption)}
                disabled={changing}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 rounded-md disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{countryOption.flag}</span>
                  <div>
                    <div className="text-sm font-medium">{countryOption.name}</div>
                    <div className="text-xs text-gray-500">{countryOption.currency} ({countryOption.symbol})</div>
                  </div>
                </div>
                {country.code === countryOption.code && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200 p-2">
            <div className="text-xs text-gray-500 px-2">
              Currency and products will be shown based on your selection
            </div>
          </div>
        </div>
      )}

      {changing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 animate-spin" />
            <span className="text-sm">Changing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
