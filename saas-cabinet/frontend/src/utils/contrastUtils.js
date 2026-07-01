/**
 * Contrast Management Utility
 * Automatically determines optimal text color based on background
 * Ensures WCAG accessibility standards are met
 */

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color code (#RRGGBB or #RGB)
 * @returns {object} RGB object with r, g, b properties
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2}|[a-f\d]{1})([a-f\d]{2}|[a-f\d]{1})([a-f\d]{2}|[a-f\d]{1})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  
  let r = result[1];
  let g = result[2];
  let b = result[3];
  
  if (r.length === 1) r = r + r;
  if (g.length === 1) g = g + g;
  if (b.length === 1) b = b + b;
  
  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16)
  };
};

/**
 * Extract RGB from rgba or rgb string
 * @param {string} rgbString - CSS color string (rgba or rgb)
 * @returns {object} RGB object with r, g, b properties
 */
export const extractRgb = (rgbString) => {
  const match = rgbString.match(/\d+/g);
  if (!match || match.length < 3) return { r: 255, g: 255, b: 255 };
  
  return {
    r: parseInt(match[0]),
    g: parseInt(match[1]),
    b: parseInt(match[2])
  };
};

/**
 * Calculate relative luminance of a color
 * Based on WCAG formula
 * @param {object} rgb - RGB object with r, g, b properties
 * @returns {number} Luminance value (0-1)
 */
export const getLuminance = (rgb) => {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculate contrast ratio between two colors
 * @param {object} rgb1 - First RGB object
 * @param {object} rgb2 - Second RGB object
 * @returns {number} Contrast ratio (1-21)
 */
export const getContrastRatio = (rgb1, rgb2) => {
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Determine if text should be light or dark based on background
 * @param {string} bgColor - Background color (hex, rgb, or rgba)
 * @returns {object} Object with color, weight, and shadow recommendations
 */
export const getOptimalTextColor = (bgColor) => {
  let rgb;
  
  if (bgColor.startsWith('#')) {
    rgb = hexToRgb(bgColor);
  } else if (bgColor.startsWith('rgb')) {
    rgb = extractRgb(bgColor);
  } else {
    return {
      color: '#ffffff',
      isDark: false,
      weight: 500,
      shadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      contrastRatio: 4.5
    };
  }
  
  const luminance = getLuminance(rgb);
  const isDark = luminance < 0.5;
  
  const lightRgb = { r: 255, g: 255, b: 255 };
  const darkRgb = { r: 22, g: 32, b: 51 }; // --ink color
  
  const contrastLight = getContrastRatio(rgb, lightRgb);
  const contrastDark = getContrastRatio(rgb, darkRgb);
  
  // Choose color with better contrast
  const useLight = contrastLight > contrastDark;
  
  return {
    color: useLight ? '#ffffff' : '#162033',
    isDark: !useLight,
    weight: useLight ? 500 : 600,
    shadow: useLight ? '0 1px 3px rgba(0, 0, 0, 0.4)' : 'none',
    contrastRatio: Math.max(contrastLight, contrastDark),
    opacity: contrastLight > 7 || contrastDark > 7 ? 1 : 0.95
  };
};

/**
 * Generate overlay color for better text readability on images
 * @param {boolean} isDark - Is background dark
 * @param {number} intensity - Overlay intensity (0-1)
 * @returns {string} RGBA overlay color
 */
export const getOverlayColor = (isDark = true, intensity = 0.4) => {
  if (isDark) {
    return `rgba(0, 0, 0, ${Math.min(intensity, 0.6)})`;
  }
  return `rgba(255, 255, 255, ${Math.min(intensity, 0.5)})`;
};

/**
 * Get text styles object based on background
 * @param {string} bgColor - Background color
 * @param {object} options - Additional style options
 * @returns {object} Complete text style object
 */
export const getTextStyles = (bgColor, options = {}) => {
  const textColor = getOptimalTextColor(bgColor);
  
  return {
    color: textColor.color,
    fontWeight: options.weight || textColor.weight,
    textShadow: textColor.shadow,
    opacity: textColor.opacity,
    letterSpacing: options.letterSpacing || '0.3px',
    lineHeight: options.lineHeight || 1.5,
    ...options
  };
};

export default {
  hexToRgb,
  extractRgb,
  getLuminance,
  getContrastRatio,
  getOptimalTextColor,
  getOverlayColor,
  getTextStyles
};
