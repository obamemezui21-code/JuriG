# UI/UX System Documentation

## Overview

This documentation covers the new UI/UX system implemented to ensure accessibility, responsive design, and optimal contrast throughout the application.

## Components & Utilities

### 1. **Contrast Management System**

#### `contrastUtils.js`

Automatically manages text color based on background for WCAG accessibility compliance.

**Key Functions:**

- `getOptimalTextColor(bgColor)` - Returns optimal text color with accessibility metrics
- `getTextStyles(bgColor, options)` - Returns complete text style object
- `getContrastRatio(rgb1, rgb2)` - Calculates WCAG contrast ratio
- `getLuminance(rgb)` - Calculates color luminance
- `getOverlayColor(isDark, intensity)` - Generates overlay color

**Example:**

```jsx
import { getOptimalTextColor, getTextStyles } from '@/utils/contrastUtils';

// Get optimal text color for a background
const textStyle = getOptimalTextColor('#ffffff');
console.log(textStyle);
// Output: { color: '#162033', isDark: true, weight: 600, ... }

// Get complete text styles
const styles = getTextStyles('#162033', { fontSize: '1.5rem' });
```

---

### 2. **Accessible Text Components**

#### `AccessibleText.jsx`

Pre-built components that automatically handle contrast for different text elements.

**Components:**

- `<AccessibleText>` - Generic accessible text
- `<AccessibleHeading>` - Heading (h1-h6) with auto contrast
- `<AccessibleParagraph>` - Paragraph with optimal styling
- `<AccessibleLabel>` - Form labels with automatic contrast

**Example:**

```jsx
import { AccessibleHeading, AccessibleParagraph } from '@/components/AccessibleText';

export const MySection = () => (
  <div style={{ backgroundColor: '#17345f' }}>
    <AccessibleHeading level={1} bgColor="#17345f">
      Welcome
    </AccessibleHeading>
    <AccessibleParagraph bgColor="#17345f" size="medium">
      This text will automatically adjust its color for optimal readability.
    </AccessibleParagraph>
  </div>
);
```

---

### 3. **Icon System**

#### `icons.js`

Semantic icons that only appear when they improve UX.

**Available Icons:**

```javascript
Icons.Home          // 🏠 Navigation
Icons.Search        // 🔍 Search
Icons.Profile       // 👤 User profile
Icons.Settings      // ⚙️ Configuration
Icons.Notifications // 🔔 Alerts
Icons.Payment       // 💳 Financial
Icons.Lock          // 🔒 Security
Icons.Download      // ⬇️ File operations
// ... and many more
```

**Usage:**

```jsx
import { Icon } from '@/utils/icons';

export const MenuItem = () => (
  <button>
    <Icon type="Home" size="1.5em" /> Home
  </button>
);
```

---

### 4. **Image Components**

#### `ImageWithOverlay.jsx`

Automatically applies overlays to images for better text readability.

**Components:**

- `<ImageWithOverlay>` - Image with smart overlay
- `<BackgroundImageContainer>` - Full-width background with overlay
- `<ResponsiveImage>` - Responsive image scaling

**Example:**

```jsx
import { ImageWithOverlay, BackgroundImageContainer } from '@/components/ImageWithOverlay';

export const HeroSection = () => (
  <BackgroundImageContainer 
    backgroundImage="/hero.jpg" 
    minHeight="500px"
    overlayIntensity={0.5}
  >
    <h1>Welcome to Our Platform</h1>
    <p>This text will be perfectly readable</p>
  </BackgroundImageContainer>
);
```

---

### 5. **Theme Management**

#### `ThemeContext.jsx` & `ThemeToggle.jsx`

Manages light/dark mode throughout the application.

**Features:**

- Persists user preference in localStorage
- Respects system preferences
- Global theme switching
- Smooth transitions

**Usage:**

```jsx
import { ThemeProvider } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

// Wrap your app
function App() {
  return (
    <ThemeProvider>
      <ThemeToggle position="fixed" showLabel={true} />
      {/* Your app content */}
    </ThemeProvider>
  );
}

// Use in components
function MyComponent() {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  
  return (
    <div>
      Current theme: {theme}
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

---

### 6. **Responsive Design System**

#### `responsive.css`

Comprehensive responsive design utilities and components.

**Features:**

- **Breakpoints:**
  - Mobile: 480px
  - Tablet: 768px
  - Desktop: 1024px
  - Wide: 1440px

- **Responsive Spacing Grid:**
  ```html
  <div class="grid grid-3">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
  </div>
  ```

- **Responsive Typography:**
  - Uses `clamp()` for fluid scaling
  - Maintains readability across all devices

- **Utility Classes:**
  - `.flex`, `.flex-col`, `.flex-center`
  - `.gap-sm`, `.gap-md`, `.gap-lg`
  - `.text-center`, `.font-bold`
  - `.shadow`, `.shadow-lg`
  - `.mobile-only`, `.desktop-only`

---

## Implementation Best Practices

### 1. **Always Use Accessible Text Components**

❌ **Bad:**
```jsx
<div style={{ color: 'white', backgroundColor: '#162033' }}>
  This might have poor contrast
</div>
```

✅ **Good:**
```jsx
<AccessibleHeading bgColor="#162033" level={1}>
  This has perfect contrast
</AccessibleHeading>
```

### 2. **Use Icons Strategically**

❌ **Bad:**
```jsx
// Too many icons
<Icon type="Home" /> Home
<Icon type="Info" /> Information
<Icon type="Help" /> Help
<Icon type="Settings" /> Settings
```

✅ **Good:**
```jsx
// Icons where they add value
<Icon type="Home" /> Dashboard
<Icon type="Payment" /> Invoice #123
```

### 3. **Apply Overlays to Images**

❌ **Bad:**
```jsx
<img src="background.jpg" />
<h1>Hard to read white text</h1>
```

✅ **Good:**
```jsx
<ImageWithOverlay src="background.jpg">
  <h1>Easy to read white text</h1>
</ImageWithOverlay>
```

### 4. **Mobile-First Responsive Design**

❌ **Bad:**
```css
.card {
  width: 80%;
}

@media (max-width: 768px) {
  .card {
    width: 100%;
  }
}
```

✅ **Good:**
```css
.card {
  width: 100%;
}

@media (min-width: 768px) {
  .card {
    width: 80%;
  }
}
```

### 5. **Use Responsive Typography**

```jsx
// Use clamp() for fluid typography
h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}
```

---

## Accessibility Checklist

- [ ] All text has sufficient contrast (ratio ≥ 4.5:1)
- [ ] Images have descriptive alt text
- [ ] Forms have associated labels
- [ ] Focus states are visible
- [ ] Icons have appropriate aria-labels
- [ ] Colors are not the only way to convey information
- [ ] Keyboard navigation works throughout
- [ ] Reduced motion is respected
- [ ] Touch targets are at least 44x44px

---

## Performance Tips

1. **Use Lazy Loading for Images:**
   ```jsx
   <ResponsiveImage src="image.jpg" loading="lazy" />
   ```

2. **Optimize CSS:**
   - Use CSS Grid for layouts (better than flexbox for this)
   - Leverage CSS custom properties for theming
   - Minimize media query breakpoints

3. **Code Splitting:**
   - Use React.lazy() for large components
   - Load routes on-demand

4. **Caching:**
   - Cache contrast calculations if possible
   - Leverage browser caching for static assets

---

## Migration Guide

### From Old System to New

**Step 1:** Wrap your App with ThemeProvider
```jsx
import { ThemeProvider } from '@/context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your routes */}
    </ThemeProvider>
  );
}
```

**Step 2:** Replace hardcoded text with Accessible components
```jsx
// Before
<div style={{ color: '#162033' }}>Text</div>

// After
<AccessibleText bgColor="#f3efe7">Text</AccessibleText>
```

**Step 3:** Add ThemeToggle to your header
```jsx
import ThemeToggle from '@/components/ThemeToggle';

export const Header = () => (
  <header>
    <h1>My App</h1>
    <ThemeToggle position="fixed" />
  </header>
);
```

**Step 4:** Update CSS with responsive utilities
```html
<div class="container">
  <div class="grid grid-3 gap-lg">
    <!-- Your content -->
  </div>
</div>
```

---

## Troubleshooting

**Q: Text is hard to read on dark backgrounds**
A: Use `getOptimalTextColor()` or `<AccessibleText>` component

**Q: Theme not persisting**
A: Ensure ThemeProvider wraps your entire app at the highest level

**Q: Icons not displaying**
A: Check browser support for emoji rendering; use `Icon` component for consistency

**Q: Responsive design not working**
A: Import `responsive.css` and use class names like `grid-3`, `grid-2`

---

## Resources

- [WCAG Contrast Standards](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Accessible Color Combinations](https://webaim.org/articles/contrast/)
- [Responsive Design Best Practices](https://web.dev/responsive-web-design-basics/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Support

For questions or issues, please refer to the component JSDoc comments or contact the development team.
