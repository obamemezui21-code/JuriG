# AI/Code Generator Instructions - UI/UX System

## Overview

This instruction set ensures all code generation follows the UI/UX principles implemented in this project. These guidelines must be applied to ANY new code, component, or feature added to the application.

## Core Principles

### 1. **Accessibility First**

Every UI element must be accessible by default:

```jsx
// ❌ WRONG - No color defined
<div>Click me</div>

// ✅ RIGHT - Uses accessible component with auto contrast
<AccessibleText bgColor={backgroundColor}>Click me</AccessibleText>
```

### 2. **Automatic Contrast Management**

NEVER hardcode text colors. Always use the contrast system:

```jsx
// ❌ WRONG
const Card = ({ bgColor }) => (
  <div style={{ backgroundColor: bgColor }}>
    <div style={{ color: '#000000' }}>Title</div>
    <div style={{ color: '#ffffff' }}>Subtitle</div>
  </div>
);

// ✅ RIGHT
import { AccessibleHeading, AccessibleParagraph } from '@/components/AccessibleText';

const Card = ({ bgColor }) => (
  <div style={{ backgroundColor: bgColor }}>
    <AccessibleHeading level={3} bgColor={bgColor}>Title</AccessibleHeading>
    <AccessibleParagraph bgColor={bgColor}>Subtitle</AccessibleParagraph>
  </div>
);
```

### 3. **Icons as Enhancement, Not Decoration**

Use icons ONLY when they:
- Improve comprehension
- Aid navigation
- Reinforce the message
- Are contextually relevant

```jsx
// ❌ WRONG - Too many icons, no added value
<button>
  <Icon type="Save" />
  <Icon type="Check" />
  Save Changes
  <Icon type="Success" />
</button>

// ✅ RIGHT - Icon adds real value
<button>
  <Icon type="Download" />
  Export Report
</button>
```

### 4. **Responsive Design by Default**

Every component must work on mobile, tablet, and desktop without modification:

```jsx
// ❌ WRONG - Fixed widths
const Layout = () => (
  <div style={{ width: '1200px' }}>Content</div>
);

// ✅ RIGHT - Responsive by default
const Layout = () => (
  <div className="container">
    <div className="grid grid-3 gap-lg">Content</div>
  </div>
);
```

### 5. **Image Overlays for Readability**

Never place text directly over images without an overlay:

```jsx
// ❌ WRONG
<div style={{ backgroundImage: 'url(image.jpg)' }}>
  <h1>Hard to read</h1>
</div>

// ✅ RIGHT
<ImageWithOverlay src="image.jpg">
  <h1>Easy to read</h1>
</ImageWithOverlay>

// OR use BackgroundImageContainer
<BackgroundImageContainer backgroundImage="image.jpg">
  <h1>Perfect readability</h1>
</BackgroundImageContainer>
```

---

## Implementation Rules

### Rule 1: Text Components

**When to use:** Whenever displaying text that needs to adapt to background

```jsx
// Page backgrounds
import { AccessibleHeading } from '@/components/AccessibleText';

export const Page = () => (
  <AccessibleHeading bgColor="var(--bg)" level={1}>
    Page Title
  </AccessibleHeading>
);

// Card backgrounds
<AccessibleParagraph bgColor="#ffffff">
  Card content
</AccessibleParagraph>

// Dynamic backgrounds
<AccessibleText bgColor={dynamicColor}>
  Adaptive text
</AccessibleText>
```

### Rule 2: Color Props

ALWAYS include background color in text components:

```jsx
// ❌ WRONG
<AccessibleHeading level={1}>Title</AccessibleHeading>

// ✅ RIGHT
<AccessibleHeading level={1} bgColor={backgroundColor}>Title</AccessibleHeading>

// ✅ RIGHT - With default
<AccessibleHeading level={1} bgColor="var(--bg)">Title</AccessibleHeading>
```

### Rule 3: Icon Usage

**Where to use:**
- Navigation items
- Action buttons (Download, Upload, Delete, etc.)
- Status indicators (Success, Warning, Error)
- Type indicators (Calendar, Clock, Location)

**Where NOT to use:**
- Decorative purposes
- When text alone is sufficient
- In forms (unless absolutely necessary)
- Multiple icons in sequence

```jsx
// ✅ GOOD
<button><Icon type="Download" /> Export</button>
<nav><Icon type="Home" /> Dashboard</nav>
<Icon type="Lock" /> Secure

// ❌ BAD
<h1><Icon type="Welcome" /> Welcome</h1>
<p><Icon type="Text" /> Some content</p>
<form>
  <Icon type="Input" />
  <input type="text" />
</form>
```

### Rule 4: Responsive Containers

Use these patterns for responsive layouts:

```jsx
// Simple container
<div className="container">Content</div>

// Responsive grid
<div className="grid grid-3 gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Flexbox
<div className="flex flex-between gap-md">
  <div>Left</div>
  <div>Right</div>
</div>

// Mobile-only content
<div className="mobile-only">Mobile Menu</div>

// Desktop-only content
<div className="desktop-only">Desktop Navigation</div>
```

### Rule 5: Image Handling

```jsx
// For images with overlay
<ImageWithOverlay 
  src="image.jpg" 
  alt="Description"
  overlayPosition="bottom"
  overlayIntensity={0.4}
>
  <h2>Title</h2>
  <p>Description</p>
</ImageWithOverlay>

// For responsive images
<ResponsiveImage 
  src="image.jpg" 
  alt="Description"
  maxWidth="100%"
/>

// For hero/background sections
<BackgroundImageContainer
  backgroundImage="hero.jpg"
  minHeight="400px"
  overlayIntensity={0.5}
>
  <h1>Hero Title</h1>
</BackgroundImageContainer>
```

---

## Component Structure Template

When creating NEW components, use this structure:

```jsx
/**
 * MyComponent
 * Brief description of what this component does
 * Ensures accessibility and responsiveness
 */

import React from 'react';
import { AccessibleHeading, AccessibleParagraph } from '@/components/AccessibleText';
import { Icon } from '@/utils/icons';

export const MyComponent = ({
  title = 'Default Title',
  description = '',
  bgColor = 'var(--bg)',
  isDark = false,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`my-component ${className}`}
      style={{ backgroundColor: bgColor }}
      {...props}
    >
      {/* Use accessible components */}
      <AccessibleHeading level={2} bgColor={bgColor}>
        {title}
      </AccessibleHeading>
      
      {description && (
        <AccessibleParagraph bgColor={bgColor}>
          {description}
        </AccessibleParagraph>
      )}
      
      {/* Responsive structure */}
      <div className="grid grid-2 gap-lg" style={{ marginTop: '1rem' }}>
        {/* Content */}
      </div>
    </div>
  );
};

export default MyComponent;
```

---

## Form Components Pattern

Forms MUST be accessible:

```jsx
export const FormExample = () => {
  return (
    <form>
      <div className="mb-lg">
        <AccessibleLabel htmlFor="email" required bgColor="var(--bg)">
          Email Address
        </AccessibleLabel>
        <input 
          id="email"
          type="email" 
          placeholder="you@example.com"
          required
          aria-required="true"
        />
      </div>
      
      <button type="submit">
        <Icon type="Check" /> Submit
      </button>
    </form>
  );
};
```

---

## Colors & Theming

Use the CSS variables defined in `index.css`:

```jsx
// Light theme (default)
backgroundColor: 'var(--bg)'          // #f3efe7
color: 'var(--ink)'                  // #162033
borderColor: 'var(--line)'           // rgba(40, 52, 79, 0.14)

// Brand colors
backgroundColor: 'var(--brand)'       // #17345f
backgroundColor: 'var(--brand-soft)' // #edf2fb

// Accent colors
backgroundColor: 'var(--accent)'      // #b5965d
backgroundColor: 'var(--danger)'      // #b4232c

// Text colors
color: 'var(--ink)'      // Dark text
color: 'var(--muted)'    // Muted text
```

---

## Testing Checklist for Generated Code

Before submitting code, ensure:

- [ ] Text is readable on all backgrounds (contrast ≥ 4.5:1)
- [ ] All text uses accessible components
- [ ] Icons are used only when they add value
- [ ] Layout is responsive (mobile, tablet, desktop)
- [ ] Images have overlays when text is placed over them
- [ ] Form labels are properly associated
- [ ] Focus states are visible
- [ ] No hardcoded text colors
- [ ] All colors use CSS variables
- [ ] Component works with both light and dark themes

---

## Common Mistakes to Avoid

### ❌ Hardcoded Colors

```jsx
// Wrong
<div style={{ color: '#ffffff', backgroundColor: '#000000' }}>
```

### ❌ Missing Alt Text

```jsx
// Wrong
<img src="image.jpg" />

// Right
<img src="image.jpg" alt="Descriptive text" />
```

### ❌ Poor Contrast

```jsx
// Wrong - Gray text on light background
<div style={{ color: '#999999', backgroundColor: '#f0f0f0' }}>

// Right - Use accessible component
<AccessibleText bgColor="#f0f0f0">
```

### ❌ Unresponsive Layouts

```jsx
// Wrong
<div style={{ width: '800px' }}>

// Right
<div className="container">
```

### ❌ Too Many Icons

```jsx
// Wrong
<p>
  <Icon type="Home" /> Go <Icon type="To" /> Home <Icon type="Now" />
</p>

// Right
<a href="/home"><Icon type="Home" /> Go Home</a>
```

---

## Resources for Code Generators

1. **AccessibleText Components:** `/src/components/AccessibleText.jsx`
2. **Icon System:** `/src/utils/icons.js`
3. **Contrast Utilities:** `/src/utils/contrastUtils.js`
4. **Responsive CSS:** `/src/styles/responsive.css`
5. **Full Documentation:** `/UI_UX_SYSTEM.md`
6. **Live Demo:** `/src/pages/UIUXDemo.jsx`

---

## Summary

**Remember: Accessibility, Responsiveness, and Contrast are NOT optional. They are built into every component.**

For every new component or page:
1. ✅ Use `AccessibleText` components for all text
2. ✅ Include `bgColor` prop in text components
3. ✅ Make layout responsive by default
4. ✅ Add overlays to images with text
5. ✅ Use icons strategically
6. ✅ Test contrast ratios
7. ✅ Support both light and dark modes

**When in doubt, refer to `/UI_UX_SYSTEM.md` or the UIUXDemo component for examples.**
