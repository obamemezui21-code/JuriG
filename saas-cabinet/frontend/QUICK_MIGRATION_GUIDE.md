/**
 * Quick Migration Guide
 * How to integrate UI/UX system into existing pages
 */

/**
 * STEP 1: Use AccessibleText in your pages
 * 
 * Replace hardcoded colors with accessible components
 */

// ❌ BEFORE
// const OldComponent = () => (
//   <div style={{ backgroundColor: '#ffffff', color: '#162033' }}>
//     <h1>Title</h1>
//     <p>Content</p>
//   </div>
// );

// ✅ AFTER
// import { AccessibleHeading, AccessibleParagraph } from '@/components/AccessibleText';
// 
// const NewComponent = () => (
//   <div style={{ backgroundColor: '#ffffff' }}>
//     <AccessibleHeading bgColor="#ffffff" level={1}>
//       Title
//     </AccessibleHeading>
//     <AccessibleParagraph bgColor="#ffffff">
//       Content
//     </AccessibleParagraph>
//   </div>
// );

/**
 * STEP 2: Add Icons to buttons and links
 */

// ✅ Good - Icon adds value
// import { Icon } from '@/utils/icons';
// 
// <button>
//   <Icon type="Download" /> Export
// </button>

// ❌ Bad - Too many icons
// <button>
//   <Icon type="File" />
//   <Icon type="Download" />
//   <Icon type="Export" />
//   Export File
// </button>

/**
 * STEP 3: Use responsive grid system
 */

// ✅ Before - Fixed width
// <div style={{ width: '1200px' }}>
//   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

// ✅ After - Responsive
// <div className="container">
//   <div className="grid grid-3 gap-lg">

/**
 * STEP 4: Add overlays to images
 */

// ✅ Before - Hard to read text
// <div style={{ backgroundImage: 'url(image.jpg)', color: 'white' }}>
//   <h1>Text on image</h1>
// </div>

// ✅ After - Perfect contrast
// import { ImageWithOverlay } from '@/components/ImageWithOverlay';
// 
// <ImageWithOverlay src="image.jpg" overlayIntensity={0.4}>
//   <h1>Easy to read text</h1>
// </ImageWithOverlay>

/**
 * File Structure
 * 
 * src/
 * ├── utils/
 * │   ├── contrastUtils.js        ← Contrast & color management
 * │   └── icons.js                ← Icon system
 * ├── components/
 * │   ├── AccessibleText.jsx      ← Heading, Paragraph, Label
 * │   ├── ImageWithOverlay.jsx    ← Image with smart overlays
 * │   └── ThemeToggle.jsx         ← Dark/Light mode button
 * ├── context/
 * │   └── ThemeContext.jsx        ← Theme provider
 * ├── styles/
 * │   ├── responsive.css          ← Responsive system
 * │   └── themeToggle.css         ← Toggle button styles
 * └── pages/
 *     ├── dashboard/
 *     ├── clients/
 *     └── ... (update these gradually)
 * 
 * Also added:
 * ├── UI_UX_SYSTEM.md                    ← Full documentation
 * └── AI_CODE_GENERATION_INSTRUCTIONS.md ← For code generators
 */

/**
 * Most Used Components
 */

export const USAGE_EXAMPLES = {
  // Heading with auto contrast
  heading: `
    import { AccessibleHeading } from '@/components/AccessibleText';
    
    <AccessibleHeading bgColor="#ffffff" level={1}>
      Page Title
    </AccessibleHeading>
  `,

  // Paragraph with auto contrast
  paragraph: `
    import { AccessibleParagraph } from '@/components/AccessibleText';
    
    <AccessibleParagraph bgColor="#ffffff">
      This text automatically adapts to the background
    </AccessibleParagraph>
  `,

  // Icon in button
  icon: `
    import { Icon } from '@/utils/icons';
    
    <button>
      <Icon type="Download" /> Export
    </button>
  `,

  // Responsive grid
  grid: `
    <div className="container">
      <div className="grid grid-3 gap-lg">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </div>
    </div>
  `,

  // Image with overlay
  imageOverlay: `
    import { ImageWithOverlay } from '@/components/ImageWithOverlay';
    
    <ImageWithOverlay 
      src="image.jpg" 
      alt="Description"
      overlayPosition="bottom"
      overlayIntensity={0.4}
    >
      <h2>Title</h2>
      <p>Description</p>
    </ImageWithOverlay>
  `,

  // Theme toggle
  themeToggle: `
    // Automatically added to App.js
    // Already in place - no need to add manually
    <ThemeToggle position="fixed" showLabel={false} />
  `,

  // Get text color for dynamic background
  dynamicColor: `
    import { getOptimalTextColor } from '@/utils/contrastUtils';
    
    const color = getOptimalTextColor(dynamicBgColor);
    // Returns: { color: '#ffffff' or '#162033', isDark: boolean, ... }
  `
};

/**
 * Common CSS Classes
 */

export const CSS_CLASSES = {
  // Layout
  container: "Full-width container with max-width",
  
  // Grid
  grid: "Base grid container",
  "grid-1": "1 column grid",
  "grid-2": "2 column responsive grid",
  "grid-3": "3 column responsive grid",
  "grid-4": "4 column responsive grid",
  
  // Flexbox
  flex: "display: flex",
  "flex-col": "flex-direction: column",
  "flex-center": "center items and content",
  "flex-between": "space-between alignment",
  
  // Gaps
  "gap-sm": "Small gap (0.5rem)",
  "gap-md": "Medium gap (1rem)",
  "gap-lg": "Large gap (1.5rem)",
  
  // Spacing
  "px-md": "Horizontal padding (medium)",
  "py-lg": "Vertical padding (large)",
  
  // Text
  "text-center": "text-align: center",
  "font-bold": "font-weight: 700",
  "text-uppercase": "text-transform: uppercase",
  
  // Responsive
  "mobile-only": "Display on mobile only",
  "desktop-only": "Display on desktop only",
  
  // Shadows
  shadow: "Small shadow",
  "shadow-lg": "Large shadow"
};

/**
 * Migration Checklist
 * 
 * ✅ App.js wrapped with ThemeProvider
 * ✅ ThemeToggle button added
 * ✅ responsive.css imported
 * ✅ Dark mode styles added to index.css
 * 
 * Next steps:
 * [ ] Update dashboard page with new components
 * [ ] Replace buttons with Icon usage
 * [ ] Convert forms to use AccessibleLabel
 * [ ] Update card layouts with grid system
 * [ ] Add image overlays where text appears over images
 * [ ] Test dark/light mode toggle
 * [ ] Verify contrast ratios (aim for 4.5:1+)
 */

export default USAGE_EXAMPLES;
