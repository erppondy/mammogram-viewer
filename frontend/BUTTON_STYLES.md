# Gradient Button Styles

All buttons in the application now use the gradient style from Uiverse.io by Spacious74.

## Components

### GradientButton
Universal gradient button component for general use throughout the app.

**Location:** `frontend/src/components/GradientButton.tsx`

**Usage:**
```tsx
import GradientButton from './GradientButton';

<GradientButton 
  variant="primary" 
  size="md" 
  onClick={handleClick}
>
  Click Me
</GradientButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'info'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `fullWidth`: boolean (optional)
- All standard button HTML attributes

### MedicalButton
Specialized button for medical UI components with icon support.

**Location:** `frontend/src/components/MedicalUI/MedicalButton.tsx`

**Usage:**
```tsx
import { MedicalButton } from '../components/MedicalUI';

<MedicalButton 
  variant="primary" 
  size="md"
  icon={<SvgIcon />}
  iconPosition="left"
>
  Medical Action
</MedicalButton>
```

### UserProfileButton
Custom styled button for user profile with admin badge support.

**Location:** `frontend/src/components/UserProfileButton.tsx`

## Gradient Variants

### Primary (Cyan to Pink)
- Gradient: `#03a9f4` → `#f441a5`
- Use for: Main actions, primary CTAs

### Secondary (Gray)
- Gradient: `#4b5563` → `#6b7280`
- Use for: Secondary actions, cancel buttons

### Danger (Red)
- Gradient: `#ef4444` → `#dc2626`
- Use for: Delete, destructive actions

### Success (Green)
- Gradient: `#10b981` → `#059669`
- Use for: Success actions, confirmations

### Info (Blue)
- Gradient: `#3b82f6` → `#2563eb`
- Use for: Information, navigation

## Features

- **Hover Effect:** Glowing blur effect on hover
- **Active State:** Reduced blur on click
- **Disabled State:** 50% opacity, no hover effects
- **Responsive:** Adjusts size on mobile devices
- **Smooth Transitions:** 0.3-0.4s ease transitions

## Updated Pages

- ✅ Dashboard Page
- ✅ Profile Page
- ✅ Admin Dashboard Page
- ✅ Analytics Dashboard Page
- ✅ Image Gallery
- ✅ Upload Section
- ✅ Filter Panel

## Style Source

Based on design by Spacious74 from Uiverse.io
