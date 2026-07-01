/**
 * UI/UX System Demo Component
 * Shows examples of all new components and utilities
 */

import React from 'react';
import {
  AccessibleHeading,
  AccessibleParagraph,
  AccessibleLabel,
  AccessibleText
} from '../components/AccessibleText';
import { ImageWithOverlay, BackgroundImageContainer } from '../components/ImageWithOverlay';
import { Icon } from '../utils/icons';
import ThemeToggle from '../components/ThemeToggle';
import { getOptimalTextColor } from '../utils/contrastUtils';

export const UIUXDemo = () => {
  return (
    <div className="uiux-demo">
      <ThemeToggle position="fixed" showLabel />

      {/* Hero Section with Background Image */}
      <BackgroundImageContainer
        backgroundImage="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000"
        minHeight="400px"
        overlayIntensity={0.4}
      >
        <div className="container text-center">
          <AccessibleHeading level={1} bgColor="rgba(0, 0, 0, 0.4)">
            <Icon type="Dashboard" size="2em" />
            Welcome to the New UI/UX System
          </AccessibleHeading>
          <AccessibleParagraph bgColor="rgba(0, 0, 0, 0.4)" size="large">
            Experience better contrast, accessibility, and responsive design
          </AccessibleParagraph>
        </div>
      </BackgroundImageContainer>

      {/* Features Section */}
      <section className="container py-lg">
        <AccessibleHeading level={2} bgColor="#f3efe7">
          Key Features
        </AccessibleHeading>

        <div className="grid grid-3 gap-lg" style={{ marginTop: '2rem' }}>
          {/* Feature 1: Automatic Contrast */}
          <div
            className="feature-card"
            style={{
              backgroundColor: '#17345f',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Icon type="Shield" size="2em" title="Security & Accessibility" />
            <AccessibleHeading level={3} bgColor="#17345f">
              Automatic Contrast
            </AccessibleHeading>
            <AccessibleParagraph bgColor="#17345f">
              Text automatically adjusts its color based on background for perfect readability
            </AccessibleParagraph>
          </div>

          {/* Feature 2: Icon System */}
          <div
            className="feature-card"
            style={{
              backgroundColor: '#0f9f6e',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Icon type="Star" size="2em" title="Icon System" />
            <AccessibleHeading level={3} bgColor="#0f9f6e">
              Smart Icons
            </AccessibleHeading>
            <AccessibleParagraph bgColor="#0f9f6e">
              Icons appear only when they improve UX. Over 20 semantic icons available.
            </AccessibleParagraph>
          </div>

          {/* Feature 3: Responsive Design */}
          <div
            className="feature-card"
            style={{
              backgroundColor: '#b5965d',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Icon type="Refresh" size="2em" title="Responsive Design" />
            <AccessibleHeading level={3} bgColor="#b5965d">
              Fully Responsive
            </AccessibleHeading>
            <AccessibleParagraph bgColor="#b5965d">
              Mobile-first design that works perfectly on all screen sizes
            </AccessibleParagraph>
          </div>
        </div>
      </section>

      {/* Dark/Light Mode Examples */}
      <section className="container py-lg">
        <AccessibleHeading level={2} bgColor="#f3efe7">
          <Icon type="ThemeDark" size="1.5em" /> Dark Mode Support
        </AccessibleHeading>

        <div className="grid grid-2 gap-lg" style={{ marginTop: '2rem' }}>
          {/* Light Background Example */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--line)',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <AccessibleHeading level={3} bgColor="#ffffff">
              Light Mode
            </AccessibleHeading>
            <AccessibleParagraph bgColor="#ffffff">
              Perfect for daytime viewing and bright environments
            </AccessibleParagraph>
            <AccessibleLabel bgColor="#ffffff">
              This label automatically adapts to the background
            </AccessibleLabel>
            <button style={{ marginTop: '1rem', width: 'fit-content' }}>
              <Icon type="Check" /> Light Mode Active
            </button>
          </div>

          {/* Dark Background Example */}
          <div
            style={{
              backgroundColor: '#162033',
              padding: '2rem',
              borderRadius: '0.5rem',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <AccessibleHeading level={3} bgColor="#162033">
              Dark Mode
            </AccessibleHeading>
            <AccessibleParagraph bgColor="#162033">
              Easier on the eyes at night and reduces eye strain
            </AccessibleParagraph>
            <AccessibleLabel bgColor="#162033">
              White text on dark background with perfect contrast
            </AccessibleLabel>
            <button
              style={{
                marginTop: '1rem',
                width: 'fit-content',
                backgroundColor: '#ffffff',
                color: '#162033'
              }}
            >
              <Icon type="Check" /> Dark Mode Available
            </button>
          </div>
        </div>
      </section>

      {/* Image with Overlay Example */}
      <section className="container py-lg">
        <AccessibleHeading level={2} bgColor="#f3efe7">
          <Icon type="Download" size="1.5em" /> Image Overlays
        </AccessibleHeading>

        <div className="grid grid-2 gap-lg" style={{ marginTop: '2rem' }}>
          <ImageWithOverlay
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500"
            alt="Team collaboration"
            overlayPosition="bottom"
            overlayIntensity={0.5}
          >
            <AccessibleHeading level={3} bgColor="rgba(0, 0, 0, 0.5)">
              Team Collaboration
            </AccessibleHeading>
            <AccessibleParagraph bgColor="rgba(0, 0, 0, 0.5)" size="small">
              Work better together with our tools
            </AccessibleParagraph>
          </ImageWithOverlay>

          <ImageWithOverlay
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500"
            alt="Professional environment"
            overlayPosition="full"
            overlayIntensity={0.3}
          >
            <div className="flex flex-col flex-center" style={{ height: '100%', gap: '1rem' }}>
              <Icon type="Lock" size="3em" title="Secure Platform" />
              <AccessibleHeading level={3} bgColor="rgba(0, 0, 0, 0.3)">
                Enterprise Grade Security
              </AccessibleHeading>
            </div>
          </ImageWithOverlay>
        </div>
      </section>

      {/* Icon Examples */}
      <section className="container py-lg">
        <AccessibleHeading level={2} bgColor="#f3efe7">
          <Icon type="Star" size="1.5em" /> Available Icons
        </AccessibleHeading>

        <div className="grid grid-4 gap-md" style={{ marginTop: '2rem', textAlign: 'center' }}>
          {[
            { name: 'Home', type: 'Home' },
            { name: 'Search', type: 'Search' },
            { name: 'Profile', type: 'Profile' },
            { name: 'Settings', type: 'Settings' },
            { name: 'Notifications', type: 'Notifications' },
            { name: 'Download', type: 'Download' },
            { name: 'Upload', type: 'Upload' },
            { name: 'Payment', type: 'Payment' },
            { name: 'Lock', type: 'Lock' },
            { name: 'Success', type: 'Success' },
            { name: 'Warning', type: 'Warning' },
            { name: 'Calendar', type: 'Calendar' }
          ].map(icon => (
            <div key={icon.type} style={{ padding: '1rem' }}>
              <Icon type={icon.type} size="2em" title={icon.name} />
              <AccessibleText bgColor="#ffffff" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                {icon.name}
              </AccessibleText>
            </div>
          ))}
        </div>
      </section>

      {/* Responsive Grid Example */}
      <section className="container py-lg">
        <AccessibleHeading level={2} bgColor="#f3efe7">
          Responsive Grid System
        </AccessibleHeading>

        <div className="grid grid-3 gap-lg" style={{ marginTop: '2rem' }}>
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div
              key={num}
              style={{
                backgroundColor: '#edf2fb',
                padding: '2rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                minHeight: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--brand)'
              }}
            >
              <AccessibleText bgColor="#edf2fb">
                Grid Item {num}
              </AccessibleText>
            </div>
          ))}
        </div>
        <AccessibleParagraph bgColor="#f3efe7" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          <Icon type="Info" /> This grid automatically adapts from 3 columns on desktop to 1 column on mobile
        </AccessibleParagraph>
      </section>

      {/* Call to Action */}
      <section className="container text-center py-2xl">
        <AccessibleHeading level={2} bgColor="#f3efe7">
          Ready to implement this system?
        </AccessibleHeading>
        <AccessibleParagraph bgColor="#f3efe7">
          Check out the documentation in <code>UI_UX_SYSTEM.md</code> for detailed implementation guide.
        </AccessibleParagraph>
        <button
          style={{
            backgroundColor: 'var(--brand)',
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1rem',
            marginTop: '1rem'
          }}
        >
          <Icon type="Download" /> Get Started
        </button>
      </section>
    </div>
  );
};

export default UIUXDemo;
