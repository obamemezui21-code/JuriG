/**
 * AccessibleText Component
 * Automatically adapts text color based on background for optimal contrast
 * Ensures WCAG accessibility standards
 */

import React from 'react';
import { getOptimalTextColor } from '../utils/contrastUtils';

export const AccessibleText = ({
  children,
  bgColor = '#ffffff',
  as: Component = 'div',
  className = '',
  style = {},
  fontSize = 'inherit',
  weight = 'auto',
  spacing = 'normal',
  ...props
}) => {
  const textStyles = getOptimalTextColor(bgColor);
  
  const computedStyle = {
    color: textStyles.color,
    fontWeight: weight === 'auto' ? textStyles.weight : weight,
    fontSize,
    letterSpacing: spacing === 'normal' ? '0.3px' : spacing,
    textShadow: textStyles.shadow === 'none' ? 'none' : textStyles.shadow,
    opacity: textStyles.opacity,
    ...style
  };
  
  return (
    <Component 
      className={className} 
      style={computedStyle}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * AccessibleHeading Component
 * Heading with automatic contrast adjustment
 */
export const AccessibleHeading = ({
  level = 1,
  children,
  bgColor = '#ffffff',
  className = '',
  style = {},
  ...props
}) => {
  const headingTag = `h${Math.max(1, Math.min(6, level))}`;
  const textStyles = getOptimalTextColor(bgColor);
  
  const headingWeights = {
    1: 700,
    2: 700,
    3: 600,
    4: 600,
    5: 500,
    6: 500
  };
  
  const headingSizes = {
    1: '2.5rem',
    2: '2rem',
    3: '1.5rem',
    4: '1.25rem',
    5: '1rem',
    6: '0.875rem'
  };
  
  const computedStyle = {
    color: textStyles.color,
    fontWeight: headingWeights[level],
    fontSize: headingSizes[level],
    textShadow: textStyles.shadow === 'none' ? 'none' : textStyles.shadow,
    opacity: textStyles.opacity,
    lineHeight: 1.2,
    marginBottom: '0.5rem',
    ...style
  };
  
  return React.createElement(
    headingTag,
    { className, style: computedStyle, ...props },
    children
  );
};

/**
 * AccessibleParagraph Component
 * Paragraph with optimal text styling
 */
export const AccessibleParagraph = ({
  children,
  bgColor = '#ffffff',
  className = '',
  style = {},
  size = 'medium',
  ...props
}) => {
  const textStyles = getOptimalTextColor(bgColor);
  
  const sizes = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.125rem'
  };
  
  const computedStyle = {
    color: textStyles.color,
    fontSize: sizes[size] || size,
    fontWeight: textStyles.weight,
    lineHeight: 1.6,
    letterSpacing: '0.3px',
    textShadow: textStyles.shadow === 'none' ? 'none' : textStyles.shadow,
    opacity: textStyles.opacity,
    margin: '1rem 0',
    ...style
  };
  
  return (
    <p className={className} style={computedStyle} {...props}>
      {children}
    </p>
  );
};

/**
 * AccessibleLabel Component
 * Form label with automatic contrast
 */
export const AccessibleLabel = ({
  children,
  bgColor = '#ffffff',
  htmlFor = '',
  required = false,
  className = '',
  style = {},
  ...props
}) => {
  const textStyles = getOptimalTextColor(bgColor);
  
  const computedStyle = {
    color: textStyles.color,
    fontWeight: textStyles.weight,
    fontSize: '0.95rem',
    letterSpacing: '0.2px',
    display: 'block',
    marginBottom: '0.5rem',
    textShadow: textStyles.shadow === 'none' ? 'none' : textStyles.shadow,
    opacity: textStyles.opacity,
    ...style
  };
  
  return (
    <label 
      htmlFor={htmlFor} 
      className={className} 
      style={computedStyle}
      {...props}
    >
      {children}
      {required && <span style={{ color: '#b4232c', marginLeft: '0.25rem' }}>*</span>}
    </label>
  );
};

export default {
  AccessibleText,
  AccessibleHeading,
  AccessibleParagraph,
  AccessibleLabel
};
