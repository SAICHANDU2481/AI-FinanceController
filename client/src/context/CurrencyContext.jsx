import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext(null);

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012, // 1 INR = 0.012 USD
  EUR: 0.011, // 1 INR = 0.011 EUR
  GBP: 0.0095 // 1 INR = 0.0095 GBP
};

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || user?.currency || 'INR';
  });

  useEffect(() => {
    if (user?.currency) {
      setCurrency(user.currency);
    }
  }, [user]);

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatCurrency = (amountInINR, showDecimals = false) => {
    if (amountInINR === undefined || amountInINR === null || isNaN(amountInINR)) {
      return `${CURRENCY_SYMBOLS[currency] || '₹'}0`;
    }

    const rate = EXCHANGE_RATES[currency] || 1;
    const converted = amountInINR * (currency === 'INR' ? 1 : rate);

    if (currency === 'INR') {
      return `₹${Math.round(converted).toLocaleString('en-IN')}`;
    }

    return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString('en-US', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol: CURRENCY_SYMBOLS[currency] || '₹',
        changeCurrency,
        formatCurrency,
        availableCurrencies: [
          { code: 'INR', label: 'INR (₹) - Rupee', symbol: '₹' },
          { code: 'USD', label: 'USD ($) - US Dollar', symbol: '$' },
          { code: 'EUR', label: 'EUR (€) - Euro', symbol: '€' },
          { code: 'GBP', label: 'GBP (£) - British Pound', symbol: '£' }
        ]
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
