/**
 * Image with Smart Overlay Component
 * Automatically adds overlay to images for better text readability
 * Responsive and accessible
 */

import React from 'react';
import { getOverlayColor, extractRgb, getLuminance } from '../utils/contrastUtils';

export const ImageWithOverlay = ({
  src,
  alt = 'Image',
  children,
  overlayIntensity = 0.4,
  overlayPosition = 'bottom',
  className = '',
  style = {},
  height = '300px',
  objectFit = 'cover',
  onClick = null,
  ...props
}) => {
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height,
    overflow: 'hidden',
    borderRadius: '0.5rem',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };
  
  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit,
    display: 'block'
  };
  
  const overlayPositions = {
    top: 'inset(0 0 auto 0)',
    bottom: 'inset(auto 0 0 0)',
    center: 'inset(0)',
    full: 'inset(0)'
  };
  
  const overlayStyle = {
    position: 'absolute',
    ...getOverlayPositioning(overlayPosition),
    background: getOverlayColor(true, overlayIntensity),
    pointerEvents: 'none',
    transition: 'background 0.3s ease'
  };
  
  const contentStyle = {
    position: 'absolute',
    ...getOverlayPositioning(overlayPosition),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: overlayPosition === 'top' ? 'flex-start' : 'flex-end',
    padding: '1.5rem',
    color: '#ffffff',
    zIndex: 2,
    pointerEvents: 'auto'
  };
  
  return (
    <div 
      className={`image-with-overlay ${className}`} 
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      {...props}
    >
      <img 
        src={src} 
        alt={alt} 
        style={imageStyle}
        loading="lazy"
      />
      <div style={overlayStyle} />
      {children && <div style={contentStyle}>{children}</div>}
    </div>
  );
};

/**
 * Helper function to get overlay positioning
 */
const getOverlayPositioning = (position) => {
  const positions = {
    top: { top: 0, left: 0, right: 0, height: '40%' },
    bottom: { bottom: 0, left: 0, right: 0, height: '60%' },
    center: { top: '25%', left: 0, right: 0, height: '50%' },
    full: { top: 0, left: 0, right: 0, bottom: 0 }
  };
  
  return positions[position] || positions.bottom;
};

/**
 * Background Image Container with Smart Overlay
 * Used for hero sections and full-width backgrounds
 */
export const BackgroundImageContainer = ({
  backgroundImage,
  children,
  className = '',
  style = {},
  minHeight = '400px',
  overlayIntensity = 0.5,
  position = 'center',
  ...props
}) => {
  const containerStyle = {
    position: 'relative',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: position,
    backgroundAttachment: 'scroll',
    minHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    ...style,
    '@media (max-width: 768px)': {
      minHeight: '250px',
      backgroundAttachment: 'scroll'
    }
  };
  
  return (
    <div 
      className={`background-image-container ${className}`} 
      style={containerStyle}
      {...props}
    >
      {/* Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: getOverlayColor(true, overlayIntensity),
          zIndex: 1
        }}
      />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

/**
 * Responsive Image Component
 * Automatically scales based on viewport
 */
export const ResponsiveImage = ({
  src,
  alt = 'Image',
  srcSet = '',
  sizes = '',
  className = '',
  style = {},
  maxWidth = '100%',
  height = 'auto',
  ...props
}) => {
  const imageStyle = {
    maxWidth,
    height,
    display: 'block',
    borderRadius: '0.5rem',
    ...style
  };
  
  return (
    <img 
      src={src} 
      alt={alt}
      srcSet={srcSet}
      sizes={sizes}
      className={className}
      style={imageStyle}
      loading="lazy"
      {...props}
    />
  );
};

export default {
  ImageWithOverlay,
  BackgroundImageContainer,
  ResponsiveImage
};
