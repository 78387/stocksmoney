import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const useCurrency = () => {
  const [currency, setCurrency] = useState({
    code: 'INR',
    symbol: '₹',
    country: 'IN'
  });

  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) return;

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.country) {
            setCurrency({
              code: data.user.country.currency,
              symbol: data.user.country.symbol,
              country: data.user.country.code
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user currency:', error);
      }
    };

    fetchUserCurrency();
  }, []);

  const formatAmount = (amount) => {
    return `${currency.symbol}${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  return { currency, formatAmount };
};
