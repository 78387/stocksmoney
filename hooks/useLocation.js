'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import Cookies from 'js-cookie';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [country, setCountry] = useState({
    code: 'IN',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    flag: '🇮🇳'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency based on current country
  const formatCurrency = (amount) => {
    const formatter = new Intl.NumberFormat(
      country.code === 'IN' ? 'en-IN' : 'en-GB',
      {
        style: 'currency',
        currency: country.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );
    
    return formatter.format(amount);
  };

  // Detect user's location
  const detectLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if country is already saved in cookies
      const savedCountry = Cookies.get('userCountry');
      if (savedCountry) {
        const parsedCountry = JSON.parse(savedCountry);
        setCountry(parsedCountry);
        setLoading(false);
        return parsedCountry;
      }

      // Detect from server
      const response = await fetch('/api/location/detect');
      const data = await response.json();

      if (data.success && data.country) {
        setCountry(data.country);
        // Save to cookies for future visits
        Cookies.set('userCountry', JSON.stringify(data.country), { expires: 30 });
        return data.country;
      } else {
        throw new Error(data.message || 'Failed to detect location');
      }
    } catch (err) {
      console.error('Location detection error:', err);
      setError(err.message);
      // Use default country on error
      const defaultCountry = {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        symbol: '₹',
        flag: '🇮🇳'
      };
      setCountry(defaultCountry);
      return defaultCountry;
    } finally {
      setLoading(false);
    }
  };

  // Change country manually
  const changeCountry = async (countryCode) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/location/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ countryCode }),
      });

      const data = await response.json();

      if (data.success && data.country) {
        setCountry(data.country);
        // Update cookies
        Cookies.set('userCountry', JSON.stringify(data.country), { expires: 30 });
        return data.country;
      } else {
        throw new Error(data.message || 'Failed to change country');
      }
    } catch (err) {
      console.error('Country change error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize location detection on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const value = {
    country,
    loading,
    error,
    formatCurrency,
    detectLocation,
    changeCountry,
    isIndia: country.code === 'IN',
    isUK: country.code === 'GB'
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default useLocation;
