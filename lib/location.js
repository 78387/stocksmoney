// Location detection utility
export const SUPPORTED_COUNTRIES = {
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    flag: '🇮🇳'
  },
  GB: {
    code: 'GB', 
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    flag: '🇬🇧'
  }
};

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES.IN;

// Get user's country from IP address
export async function detectCountryFromIP(ip) {
  try {
    // Skip detection for localhost/development
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost')) {
      console.log('Localhost detected, using default country');
      return DEFAULT_COUNTRY;
    }

    console.log('Detecting country for IP:', ip);

    // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    console.log('IP detection response:', data);
    
    if (data.country_code) {
      const countryCode = data.country_code.toUpperCase();
      const detectedCountry = SUPPORTED_COUNTRIES[countryCode];
      
      if (detectedCountry) {
        console.log(`Country detected: ${detectedCountry.name} (${countryCode})`);
        return detectedCountry;
      } else {
        console.log(`Unsupported country detected: ${countryCode}, using default`);
        return DEFAULT_COUNTRY;
      }
    }
    
    console.log('No country code in response, using default');
    return DEFAULT_COUNTRY;
  } catch (error) {
    console.error('IP detection error:', error);
    return DEFAULT_COUNTRY;
  }
}

// Get client IP from request headers
export function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfIP) {
    return cfIP;
  }
  
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('remote-addr') || 
         '127.0.0.1';
}

// Format currency based on country
export function formatCurrency(amount, country = DEFAULT_COUNTRY) {
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
}

// Convert currency (basic conversion - in production use real exchange rates)
export function convertCurrency(amount, fromCountry, toCountry) {
  if (fromCountry.code === toCountry.code) {
    return amount;
  }
  
  // Basic conversion rates (update with real-time rates in production)
  const exchangeRates = {
    'INR_TO_GBP': 0.012, // 1 INR = 0.012 GBP (approximate)
    'GBP_TO_INR': 83.33  // 1 GBP = 83.33 INR (approximate)
  };
  
  if (fromCountry.code === 'INR' && toCountry.code === 'GBP') {
    return Math.round(amount * exchangeRates.INR_TO_GBP * 100) / 100;
  }
  
  if (fromCountry.code === 'GBP' && toCountry.code === 'INR') {
    return Math.round(amount * exchangeRates.GBP_TO_INR);
  }
  
  return amount;
}
