# Implementation Plan

- [ ] 1. Set up core infrastructure and utilities
  - Create TypeScript interfaces and types for all data models
  - Implement ZoomPanController utility class with zoom and pan calculations
  - Implement StateManager class with undo/redo history
  - Create utility functions for coordinate transformations and hit detection
  - _Requirements: 1.1, 2.1, 8.1_

- [ ] 2. Implement Canvas Manager and rendering engine
  - Create CanvasRenderer class with optimized rendering pipeline
  - Implement image loading and caching
  - Implement annotation rendering with proper styling (stroke width, colors, transparency)
  - Add support for rendering selected and hovered states
  - Implement offscreen canvas for performance optimization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2_

- [ ] 3. Implement zoom controls and functionality
  - Add mouse wheel zoom handler with zoom-at-cursor functionality
  - Create zoom control buttons (zoom in, zoom out, fit-to-screen, 100%)
  - Implement zoom slider component (10% - 500% range)
  - Add zoom percentage display
  - Implement smooth zoom transitions
  - Add keyboard shortcuts for zoom (+, -, 0)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 9.2, 9.3, 9.4_

- [ ] 4. Implement pan/drag functionality
  - Add spacebar + drag pan handler
  - Implement pan tool with dedicated button
  - Add right-click drag pan support
  - Implement hand cursor during panning
  - Add pan boundary constraints
  - Ensure smooth panning performance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 9.1_

- [ ] 5. Create Tool Manager and tool system
  - Implement Tool interface and base tool class
  - Create Select tool for annotation selection and movement
  - Create Pan tool for image navigation
  - Create Rectangle drawing tool with preview
  - Create Polygon drawing tool with multi-point support
  - Create Arrow drawing tool
  - Create Text annotation tool with input dialog
  - Implement tool switching logic and keyboard shortcuts
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 6.1, 6.2, 6.5, 6.7, 9.1_

- [ ] 6. Build Toolbar component
  - Create toolbar layout with tool buttons
  - Implement large, touch-friendly buttons (48x48px)
  - Add active tool highlighting
  - Implement tool icons and labels
  - Add tooltips with keyboard shortcuts
  - Create zoom controls section in toolbar
  - Add undo/redo buttons with disabled states
  - Add save button with status indicator
  - _Requirements: 3.4, 3.5, 6.3, 6.6, 8.4, 8.5_

- [ ] 7. Implement Annotations Sidebar
  - Create sidebar layout with collapsible functionality
  - Implement annotation list with scrolling
  - Create AnnotationCard component with type, color, and finding name
  - Add click-to-select and center functionality
  - Implement hover-to-highlight on image
  - Add visibility toggle (eye icon) for each annotation
  - Add edit button to modify annotation properties
  - Add delete button with confirmation
  - Display annotation count in header
  - Show empty state message when no annotations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [ ] 8. Implement event handling system
  - Create EventHandler class for mouse events
  - Implement mouse down/move/up handlers
  - Add annotation hit detection
  - Implement drawing preview during mouse move
  - Add keyboard event handler with shortcut mapping
  - Implement ESC key to cancel drawing and return to select tool
  - Add Delete/Backspace key handler for annotation deletion
  - _Requirements: 3.2, 3.3, 6.7, 9.1, 9.5_

- [ ] 9. Implement undo/redo functionality
  - Integrate StateManager with annotation changes
  - Add undo handler (Ctrl+Z)
  - Add redo handler (Ctrl+Y)
  - Update toolbar button states based on history
  - Ensure all annotation operations are tracked in history
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1_

- [ ] 10. Implement save and auto-save functionality
  - Create debounced auto-save function (2-second delay)
  - Add save status indicator (idle, saving, saved, error)
  - Implement error handling with retry logic
  - Add manual save button
  - Implement unsaved changes warning on page leave
  - Add Ctrl+S keyboard shortcut for manual save
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 9.1_

- [ ] 11. Build main ImprovedAnnotationViewer component
  - Create main component structure with props interface
  - Integrate Toolbar, Canvas, and Sidebar components
  - Implement state management and prop drilling
  - Add image loading logic
  - Wire up all event handlers
  - Implement component lifecycle and cleanup
  - _Requirements: All requirements_

- [ ] 12. Add visual enhancements and polish
  - Implement annotation glow effect on hover
  - Add smooth transitions for tool switching
  - Implement cursor changes based on active tool
  - Add visual feedback for drawing operations
  - Ensure high-contrast colors for annotations
  - Add semi-transparent backgrounds for text labels
  - Implement consistent z-ordering for overlapping annotations
  - _Requirements: 3.2, 3.3, 3.7, 5.4, 5.5, 5.6, 5.7, 5.8, 6.8_

- [ ] 13. Implement keyboard shortcuts help dialog
  - Create help dialog component
  - List all keyboard shortcuts organized by category
  - Add ? key handler to show/hide dialog
  - Style dialog for readability
  - _Requirements: 9.6_

- [ ] 14. Add accessibility features
  - Ensure all buttons have ARIA labels
  - Add keyboard focus indicators
  - Implement tab navigation order
  - Add screen reader announcements for state changes
  - Ensure minimum touch target sizes (44x44px)
  - _Requirements: 3.4, 6.3_

- [ ] 15. Optimize performance
  - Implement dirty rectangle optimization for canvas redraws
  - Add requestAnimationFrame for smooth animations
  - Optimize annotation hit detection with spatial indexing
  - Implement canvas caching for static elements
  - Profile and optimize rendering with 100+ annotations
  - Ensure 60fps during zoom and pan operations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 16. Integrate with existing annotation service
  - Update annotation service API calls if needed
  - Ensure compatibility with existing annotation data format
  - Test loading existing annotations
  - Test saving new annotations
  - Handle migration from old annotation format if necessary
  - _Requirements: 10.1, 10.2_

- [ ] 17. Update routing and navigation
  - Update image gallery to use new ImprovedAnnotationViewer
  - Add route for new annotation viewer
  - Ensure proper navigation and back button functionality
  - Test deep linking to specific images
  - _Requirements: All requirements_

- [ ] 18. Create comprehensive documentation
  - Document component APIs and props
  - Create user guide for annotation features
  - Document keyboard shortcuts
  - Add inline code comments
  - Create troubleshooting guide
  - _Requirements: All requirements_

