# Medical UI Theme Guide

## Overview
The application now features a high-tech medical interface designed for professional medical imaging environments. The theme is performance-optimized with minimal animations and efficient CSS.

## Design Philosophy

### Visual Style
- **Dark Theme**: Professional dark background (#0a0e1a) reduces eye strain during long viewing sessions
- **Cyan Accent**: Medical-grade cyan (#00d4ff) for primary actions and highlights
- **Grid Pattern**: Subtle grid background creates a technical, precise feel
- **Glow Effects**: Minimal, tasteful glow effects on interactive elements
- **Scan Lines**: Optional subtle scan line animation for high-tech feel

### Performance Optimizations
1. **CSS Variables**: All colors use CSS custom properties for instant theme switching
2. **Hardware Acceleration**: Transforms and opacity for smooth animations
3. **Reduced Motion**: Respects user's `prefers-reduced-motion` setting
4. **Minimal Animations**: Only essential animations, all under 0.3s
5. **Efficient Selectors**: Class-based styling for optimal rendering

## Color Palette

### Primary Colors
```css
--medical-primary: #00d4ff        /* Cyan - Primary actions */
--medical-primary-dark: #0099cc   /* Dark Cyan - Hover states */
--medical-secondary: #00ff88      /* Green - Success states */
--medical-accent: #ff3366         /* Red - Danger/Critical */
--medical-warning: #ffaa00        /* Orange - Warnings */
```

### Background Colors
```css
--bg-primary: #0a0e1a      /* Main background */
--bg-secondary: #111827    /* Secondary surfaces */
--bg-tertiary: #1a2332     /* Tertiary surfaces */
--bg-card: #141b2d         /* Card backgrounds */
--bg-hover: #1e2a3f        /* Hover states */
```

### Text Colors
```css
--text-primary: #e5e7eb    /* Primary text */
--text-secondary: #9ca3af  /* Secondary text */
--text-muted: #6b7280      /* Muted text */
```

## Component Library

### MedicalCard
Reusable card component with optional hover effects and scan lines.

```tsx
import { MedicalCard } from '../components/MedicalUI';

<MedicalCard hover scanLine className="p-6">
  {/* Your content */}
</MedicalCard>
```

### MedicalButton
Styled button with three variants: primary, secondary, and danger.

```tsx
import { MedicalButton } from '../components/MedicalUI';

<MedicalButton variant="primary" fullWidth>
  Submit
</MedicalButton>
```

### MedicalInput
Form input with label and error support.

```tsx
import { MedicalInput } from '../components/MedicalUI';

<MedicalInput
  label="Email Address"
  type="email"
  placeholder="Enter email"
  error={errorMessage}
/>
```

### MedicalHeader
Consistent header component with logo and actions.

```tsx
import { MedicalHeader } from '../components/MedicalUI';

<MedicalHeader title="Dashboard">
  {/* Header actions */}
</MedicalHeader>
```

### StatusBadge
Visual status indicators with glow effects.

```tsx
import { StatusBadge } from '../components/MedicalUI';

<StatusBadge status="active" label="Online" />
```

### DataDisplay
Formatted data display for metrics and values.

```tsx
import { DataDisplay } from '../components/MedicalUI';

<DataDisplay label="Total Images" value={1234} unit="files" />
```

### LoadingSpinner
Consistent loading indicator.

```tsx
import { LoadingSpinner } from '../components/MedicalUI';

<LoadingSpinner size="md" message="Loading data..." />
```

## CSS Utility Classes

### Layout
- `.medical-grid-bg` - Adds subtle grid background pattern
- `.scan-line-container` - Adds animated scan line effect

### Effects
- `.glow-text` - Adds text glow effect
- `.border-glow` - Adds border glow effect
- `.header-glow` - Adds header shadow glow

### Status Indicators
- `.status-indicator` - Base status dot
- `.status-active` - Green active status
- `.status-pending` - Orange pending status
- `.status-inactive` - Gray inactive status

### Data Display
- `.data-label` - Styled label for data fields
- `.data-value` - Styled value display (monospace, cyan)

## Best Practices

### Performance
1. **Avoid Nested Animations**: Don't nest animated elements
2. **Use Transform**: Prefer `transform` over `top/left` for animations
3. **Debounce Interactions**: Debounce rapid user interactions
4. **Lazy Load Images**: Use the LazyImage component for images
5. **Virtual Scrolling**: Implement for large lists

### Accessibility
1. **Color Contrast**: All text meets WCAG AA standards
2. **Focus States**: All interactive elements have visible focus
3. **Reduced Motion**: Animations respect user preferences
4. **Semantic HTML**: Use proper HTML5 elements
5. **ARIA Labels**: Add labels for screen readers

### Consistency
1. **Use Components**: Always use the MedicalUI components
2. **Follow Spacing**: Use Tailwind spacing utilities (4px increments)
3. **Consistent Icons**: Use the same icon style throughout
4. **Typography**: Stick to defined font sizes and weights

## Migration Guide

### Updating Existing Components

1. **Replace Background Colors**:
   ```tsx
   // Before
   className="bg-white"
   
   // After
   className="bg-[var(--bg-card)]"
   ```

2. **Replace Text Colors**:
   ```tsx
   // Before
   className="text-gray-900"
   
   // After
   className="text-[var(--text-primary)]"
   ```

3. **Replace Buttons**:
   ```tsx
   // Before
   <button className="bg-blue-600 text-white px-4 py-2 rounded">
     Click Me
   </button>
   
   // After
   <MedicalButton variant="primary">
     Click Me
   </MedicalButton>
   ```

4. **Replace Cards**:
   ```tsx
   // Before
   <div className="bg-white rounded-lg shadow-md p-6">
     {content}
   </div>
   
   // After
   <MedicalCard className="p-6">
     {content}
   </MedicalCard>
   ```

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Future Enhancements
- [ ] Dark/Light theme toggle
- [ ] Custom color scheme builder
- [ ] Additional component variants
- [ ] Animation presets
- [ ] Accessibility audit tool
