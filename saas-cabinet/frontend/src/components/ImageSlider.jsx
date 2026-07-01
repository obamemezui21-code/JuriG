import React, { useState, useEffect } from 'react';
import '../styles/imageSlider.css';

const ImageSlider = ({ images = [], autoOnly = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark-mode'));
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [autoPlay, images.length]);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setAutoPlay(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  return (
    <div className={`image-slider ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Main Slider Container */}
      <div className="image-slider__container">
        <div className="image-slider__slides">
          {images.map((image, index) => (
            <div
              key={index}
              className={`image-slider__slide ${
                index === currentIndex ? 'active' : ''
              }`}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="image-slider__image"
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
              />
              {/* Gradient overlay */}
              <div className="image-slider__overlay"></div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        {!autoOnly && (
          <>
            <button
              className="image-slider__btn image-slider__btn--prev"
              onClick={goToPrevious}
              aria-label="Image précédente"
              title="Image précédente"
            >
              ❮
            </button>
            <button
              className="image-slider__btn image-slider__btn--next"
              onClick={goToNext}
              aria-label="Image suivante"
              title="Image suivante"
            >
              ❯
            </button>

            {/* Play/Pause Button */}
            <button
              className="image-slider__play-btn"
              onClick={toggleAutoPlay}
              aria-label={autoPlay ? 'Pause' : 'Lecture'}
              title={autoPlay ? 'Pause' : 'Lecture'}
            >
              {autoPlay ? '⏸' : '▶'}
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {!autoOnly && (
        <div className="image-slider__indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`image-slider__dot ${
                index === currentIndex ? 'active' : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Aller à la slide ${index + 1}`}
              title={`Slide ${index + 1}`}
            ></button>
          ))}
        </div>
      )}

      {/* Counter */}
      {!autoOnly && (
        <div className="image-slider__counter">
          <span className="image-slider__current">{currentIndex + 1}</span>
          <span className="image-slider__separator">/</span>
          <span className="image-slider__total">{images.length}</span>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
