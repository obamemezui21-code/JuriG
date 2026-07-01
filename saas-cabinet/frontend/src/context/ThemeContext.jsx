/**
 * Theme Context
 * Manages dark/light mode throughout the application
 * Persists user preference in localStorage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = 'light';
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Light mode is enforced for the application.
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;
