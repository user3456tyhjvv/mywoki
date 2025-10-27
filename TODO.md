# TODO: Add Mobile Detection and Warning

## Task: Implement mobile device detection and display warning message

### Information Gathered:
- HomePage.tsx is the main component with responsive design already implemented
- The component uses React hooks (useState, useEffect) for state management
- Responsive classes are used throughout (sm:, md:, etc.)
- No existing mobile detection logic

### Plan:
1. Add state for mobile warning visibility
2. Implement device detection using window.innerWidth check (< 768px for mobile)
3. Add useEffect to detect mobile on load and resize
4. Create modal component for mobile warning message
5. Style the modal to match the app's dark theme

### Dependent Files to be edited:
- components/HomePage.tsx (add mobile detection and warning modal)

### Followup steps:
- Test on different screen sizes
- Verify modal appears on mobile devices
- Ensure modal can be dismissed
