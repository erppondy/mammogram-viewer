# Dashboard Action Cards

The dashboard now features animated action cards that appear after login, providing a clean and intuitive interface for users to choose their action.

## Features

### Action Cards
Two beautiful animated cards with gradient effects:

1. **Upload Images Card**
   - Icon: Upload arrow
   - Description: Upload new mammogram images for analysis
   - Supports: DICOM, PNG, JPG formats
   - Action: Opens upload interface

2. **View Gallery Card**
   - Icon: Image gallery
   - Description: Browse and manage uploaded images
   - Features: View, download, organize files
   - Action: Opens image gallery

## Card Styling

Based on gradient card design with:
- **Gradient Border**: Pink to Cyan (#e81cff → #40c9ff)
- **Blur Effect**: Animated glow on hover
- **Rotation Animation**: Border rotates on hover
- **Smooth Transitions**: 0.6s cubic-bezier easing
- **Responsive**: Adapts to mobile screens

## User Flow

1. **Login** → Dashboard with action cards
2. **Select Action**:
   - Click "Upload Images" → Upload interface
   - Click "View Gallery" → Image gallery
3. **Back Button**: Return to action cards menu
4. **Auto-redirect**: After upload completes, automatically shows gallery

## Navigation

- **Back to Menu**: Button appears in upload/gallery views
- **Header Navigation**: Always accessible
  - Profile button (with gradient style)
  - Admin button (if admin user)
  - Logout button

## Responsive Design

- **Desktop**: Cards side-by-side (280x320px each)
- **Tablet**: Cards side-by-side (240x280px each)
- **Mobile**: Cards stacked (full width, max 320px)

## Components

- `ActionCard.tsx` - Reusable animated card component
- `ActionCard.css` - Gradient animation styles
- `DashboardPage.tsx` - Main dashboard with view modes

## View Modes

- `cards` - Initial view with action cards
- `upload` - Upload interface
- `gallery` - Image gallery view
