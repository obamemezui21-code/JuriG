/**
 * Theme Toggle Component
 * Elegant button to switch between light and dark modes
 * Accessible and responsive
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../utils/icons';
import '../styles/themeToggle.css';

export const ThemeToggle = ({ 
  position = 'fixed',
  showLabel = false,
  size = 'medium'
}) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const sizeClasses = {
    small: 'theme-toggle--small',
    medium: 'theme-toggle--medium',
    large: 'theme-toggle--large'
  };

  return (
    <button
      className={`theme-toggle ${sizeClasses[size]} theme-toggle--${theme}`}
      onClick={toggleTheme}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-label={`Toggle ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-pressed={isDarkMode}
    >
      <span className="theme-toggle__icon">
        <Icon 
          type={isDarkMode ? 'ThemeLight' : 'ThemeDark'}
          size="1.5em"
          margin="0"
        />
      </span>
      {showLabel && (
        <span className="theme-toggle__label">
          {isDarkMode ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
