import React from 'react';omplete ✅

interface IconProps {ented
  className?: string;
}## 1. **Sidebar Navigation** ✅
- **Live Routing**: Clicking nav items now changes the active section in real-time
export const ChartBarIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>s team names with initials (avatars)
);- Teams update in real-time when user joins/leaves teams
  - Selected team shows with active highlighting
export const SparklesIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>atures:**
);`tsx
- useNavigation() context tracks activeSection
export const ShieldCheckIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
### 2. **Header - Search Bar** ✅
- **Live Search**: Input stored in NavigationContext `searchQuery`
export const TeamsIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svgady for Enhancement**: 
    xmlns="http://www.w3.org/2000/svg"
    className={className}sed on query
    fill="none"ng from user code can be added later
    viewBox="0 0 24 24"
    stroke="currentColor"ation Bell** ✅
  >*Badge Count**: Shows unread notification count (99+ when exceeds 99)
    <pathtime Updates**:
      strokeLinecap="round"notifications table
      strokeLinejoin="round"mount
      strokeWidth={2}n new notifications arrive
      d="M17 20v-1a4 4 0 00-4-4h-2a4 4 0 00-4 4v1m14 0v-1a4 4 0 00-3-3.87M9 7a4 4 0 118 0 4 4 0 01-8 0zm-2 0a3 3 0 11-6 0 3 3 0 016 0zm14 0a3 3 0 11-6 0 3 3 0 016 0z"
    />tification Modal**: Click bell to open notification panel
  </svg>al Feedback**:
);- Red badge with white count
  - Bell icon changes color on hover

export const EnvelopeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>playback with error handling
);Badge shows count (capped at 99+)
- Modal integration with NotificationModal
export const TrendingUpIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg> Info Display**:
);- Avatar image from user profile
  - User name from Supabase auth metadata
export const FacebookIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>gn Out** → Clears auth and returns to `/getting-started`
);**Smart Styling**:
  - Dropdown appears below profile button
export const LinkedInIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);Key Features:**
```tsx
export const InstagramIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.017 0C8.396 0 7.996.014 6.79.067 5.584.12 4.775.302 4.082.566c-.716.27-1.323.637-1.928 1.242C1.55 2.413 1.183 3.02.913 3.736c-.264.707-.446 1.516-.5 2.722C.362 7.664.35 8.064.35 11.685c0 3.621.012 4.021.067 5.227.054 1.206.236 2.015.5 2.722.27.716.637 1.323 1.242 1.928.605.605 1.212.972 1.928 1.242.707.264 1.516.446 2.722.5C7.996 23.638 8.396 23.65 12.017 23.65c3.621 0 4.021-.012 5.227-.067 1.206-.054 2.015-.236 2.722-.5.716-.27 1.323-.637 1.928-1.242.605-.605.972-1.212 1.242-1.928.264-.707.446-1.516.5-2.722.055-1.206.067-1.606.067-5.227 0-3.621-.012-4.021-.067-5.227-.054-1.206-.236-2.015-.5-2.722-.27-.716-.637-1.323-1.242-1.928C20.587 1.55 19.98 1.183 19.264.913c-.707-.264-1.516-.446-2.722-.5C16.038.014 15.638 0 12.017 0zm0 2.163c3.574 0 4.021.013 5.442.077 1.275.059 1.969.27 2.411.449.528.214.925.496 1.33.901.405.405.687.802.901 1.33.179.442.39 1.136.449 2.411.064 1.421.077 1.868.077 5.442 0 3.574-.013 4.021-.077 5.442-.059 1.275-.27 1.969-.449 2.411-.214.528-.496.925-.901 1.33-.405.405-.802.687-1.33.901-.442.179-1.136.39-2.411.449-1.421.064-1.868.077-5.442.077-3.574 0-4.021-.013-5.442-.077-1.275-.059-1.969-.27-2.411-.449-.528-.214-.925-.496-1.33-.901-.405-.405-.687-.802-.901-1.33-.179-.442-.39-1.136-.449-2.411-.064-1.421-.077-1.868-.077-5.442 0-3.574.013-4.021.077-5.442.059-1.275.27-1.969.449-2.411.214-.528.496-.925.901-1.33.405-.405.802-.687 1.33-.901.442-.179 1.136-.39 2.411-.449 1.421-.064 1.868-.077 5.442-.077zm0 3.717a6.1 6.1 0 100 12.2 6.1 6.1 0 000-12.2zm0 10.037a3.937 3.937 0 110-7.874 3.937 3.937 0 010 7.874zm6.72-11.834a1.423 1.423 0 11-2.846 0 1.423 1.423 0 012.846 0z"/>
  </svg>e and email from Supabase auth
);`

export const TwitterIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg> → Shows Team component
);- Socials → Placeholder content
  - Webs → Placeholder content
export const PaletteIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
  </svg>ch Integration**: Displays active search query in placeholder
);**Responsive Layout**: Proper padding and scrolling
- **Theme Support**: Light/dark mode for all content areas
export const MyWokiLogo: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <img src="/mywoki-logo.png" alt="MyWoki Logo" className={className} />
);`
MainContent
export const OutreachIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
### 6. **Navigation Context** ✅
export const YouTubeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>ectedTeam` - Currently selected team
);**Provider Pattern**: Wraps entire app in App1.tsx
- **Easy to Extend**: Add more global state as needed
export const TikTokIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>ation() → {
);activeSection,
  setActiveSection,
export const ThreadsIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.05 1.05 4.42L2 22l5.58-1.05C8.95 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.34 0-2.61-.36-3.73-1.01L6 19l.37-.37C7.36 17.64 9.5 17 12 17s4.64.64 6.63 1.63L19 19l-.27-.27C17.61 17.64 15.34 17 12 17z"/>
  </svg>ectedTeam
);
```
export const RedditIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 1.228-1.84 1.228-.878 0-1.66-.511-1.84-1.228-.384-1.564 1.456-2.376 3.68-2.376s4.064.812 3.68 2.376c-.18.717-.962 1.228-1.84 1.228-.878 0-1.66-.511-1.84-1.228zM7.2 10.275c0-1.276.504-2.312 1.128-2.312s1.128.936 1.128 2.112c0 1.176-.504 2.112-1.128 2.112s-1.128-.936-1.128-2.112zm7.6 0c0-1.276.504-2.312 1.128-2.312s1.128.936 1.128 2.112c0 1.176-.504 2.112-1.128 2.112s-1.128-.936-1.128-2.112zM12 16.5c-2.496 0-4.5-1.504-4.5-3.36 0-1.872 2.004-3.384 4.5-3.384s4.5 1.512 4.5 3.384c0 1.856-2.004 3.36-4.5 3.36z"/>
  </svg> Journey Example:
);
1. **User opens app** → Sidebar shows Dashboard selected
export const CreditCardIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>nContent switches to Team component
); **User types in search** → 
   - Search query stored in NavigationContext
export const XIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>m highlighted with blue background
); - MainContent shows Team component for that team
5. **User clicks bell icon** →
export const EyeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>abase subscription triggers
); - Sound plays automatically
   - Badge count updates
export const CopyIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg> Sign Out → returns to `/getting-started`
);
## File Changes Summary
export const CheckIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);# Files Modified:
- ✅ `components/Sidebar.tsx` - Live navigation, real-time teams
export const CodeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>1.tsx` - Added NavigationProvider wrapper, /settings route, Profile import
);
### Files Untouched (Already Working):
export const GlobeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c1.657 0 3-4.03 3-9s-1.343-9-3-9" />
  </svg>nents/NotificationModal.tsx`
);`contexts/ThemeContext.tsx`
- `contexts/AuthContext.tsx`
export const FrameworkIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>bar Navigation
);[ ] Click Dashboard → shows dashboard content
- [ ] Click Team → shows team content
export const XCircleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>ttings link works → goes to /settings
);[ ] Mobile: clicking nav item closes sidebar

export const HelpCircleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>aceholder text is visible
);
### Notification Bell
export const ArrowLeftIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>ick bell: NotificationModal opens
);[ ] When new notification arrives: sound plays
- [ ] Accept/Decline in modal works
export const RefreshIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>ows user name and email
);[ ] "View Profile" click → goes to /settings
- [ ] "Sign Out" click → logs out and goes to /getting-started
export const CheckCircleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>e Support
);[ ] Light mode: all colors correct
- [ ] Dark mode: all colors correct
export const ArrowRightIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);# Search Intelligence
```tsx
export const DownloadIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>learning from patterns
);nst learnFromSearches = () => {
  // Track popular searches
export const CalendarIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);# Notifications
```tsx
export const FilterIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>elete action
);`

export const ClockIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>eam switching animation
); Add active member indicators
// Add team settings
export const ArrowUpIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
); Show results panel below search
// Search across dashboards, documents, teams
export const ArrowDownIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
); Quick Reference

export const PaperClipIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>e `ContentArea` in MainContent with new case
); Add route if needed in App1.tsx

export const QuestionMarkCircleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);nst MyComponent = () => {
  const { activeSection, setActiveSection } = useNavigation();
export const TrashIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);# To Play a Sound:
```tsx
export const PaperAirplaneIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);# To Fetch User Data:
```tsx
export const MessageIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>email, user.user_metadata.full_name, etc.
);`

export const XMarkIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>play results in MainContent
); - Filter/search across dashboards
   - Self-learning algorithm
export const UserPlusIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>t team settings
); - Manage team permissions

export const HomeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svgotification preferences panel
    xmlns="http://www.w3.org/2000/svg"
    className={className}nt
    fill="none"
    viewBox="0 0 24 24"s**
    stroke="currentColor"ard section
  >- Real-time data updates
    <pathom widgets
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />**: November 20, 2025
  </svg>o Implement**: ~2 hours of development
);export const BellIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (  <svg    xmlns="http://www.w3.org/2000/svg"    className={className}    fill="none"    viewBox="0 0 24 24"    stroke="currentColor"  >    <path      strokeLinecap="round"      strokeLinejoin="round"      strokeWidth={2}      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"    />  </svg>);export const BounceIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (  <svg    xmlns="http://www.w3.org/2000/svg"    className={className}    fill="none"    viewBox="0 0 24 24"    stroke="currentColor"  >    <path      strokeLinecap="round"      strokeLinejoin="round"      strokeWidth={2}      d="M3 18c3-6 6-6 9-6s6 0 9 6M3 6c3 6 6 6 9 6s6 0 9-6"    />  </svg>);// Add these new iconsexport const TimerIcon = ({ className = "w-5 h-5" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const PagesIcon = ({ className = "w-5 h-5" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const ChatBubbleLeftRightIcon = ({ className = "w-5 h-5" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M21 15C21 15 18.5 12.5 15 12.5C11.5 12.5 9 15 9 15C9 15 6.5 12.5 3 12.5C1.34315 12.5 0 13.8431 0 15.5C0 17.1569 1.34315 18.5 3 18.5C6.5 18.5 9 21 9 21C9 21 11.5 23.5 15 23.5C18.5 23.5 21 21 21 21C21 21 22.3431 19.6569 22.3431 18C22.3431 16.3431 21 15 21 15Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const DocumentTextIcon = ({ className = "w-6 h-6" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);// Add these new iconsexport const ExclamationTriangleIcon = ({ className = "w-5 h-5" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const InformationCircleIcon = ({ className = "w-5 h-5" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const LightBulbIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (  <svg {...{ className }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">    <path d="M12 3V5M12 19V21M19 12H21M12 12H12.01M5 12H7M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>    <path d="M19 12C19 14.7614 16.7614 17 14 17C11.2386 17 9 14.7614 9 12C9 9.23858 11.2386 7 14 7C16.7614 7 19 9.23858 19 12Z"       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary" {...props}>    <path d="M6 12.4C6 12.4 8.2 11.2 11 14C13.8 16.8 16.2 15.2 16.2 15.2C16.2 15.2 20.2 12.4 23.4 16.4C26.6 20.4 26 22 26 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>    <path d="M6 18C6 18 8.2 16.8 11 19.6C13.8 22.4 16.2 20.8 16.2 20.8C16.2 20.8 20.2 18 23.4 22C26.6 26 26 27.6 26 27.6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>  </svg>);export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg     xmlns="http://www.w3.org/2000/svg"    fill="none"    viewBox="0 0 24 24"    strokeWidth={1.5}    stroke="currentColor"    {...props}  >    <path       strokeLinecap="round"      strokeLinejoin="round"      d="M7 12a3 3 0 11-6 0 3 3 0 016 0zm16 6a3 3 0 11-6 0 3 3 0 016 0zm0-12a3 3 0 11-6 0 3 3 0 016 0z"    />    <path      strokeLinecap="round"      strokeLinejoin="round"      d="M7.5 11.5L14.5 7.5M7.5 12.5l7 4"    />  </svg>);export const DocumentDuplicateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>);export const ChartBarIcon1: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>);export const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>);export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>);export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>);export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"     xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2">  <circle cx="12" cy="7" r="4"/>  <path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>);export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) =>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"      xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2">  <circle cx="12" cy="12" r="3"/>  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.36 0 .7-.13 1-.33V4a2 2 0 1 1 4 0v.09c.3.2.64.33 1 .33a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .36.13.7.33 1H21a2 2 0 1 1 0 4h-.09c-.2.3-.33.64-.33 1z"/></svg>);export const WebIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (  <svg    xmlns="http://www.w3.org/2000/svg"    fill="none"    viewBox="0 0 24 24"    strokeWidth={1.5}    stroke="currentColor"    {...props}  >    {/* Browser window outline */}    <path      strokeLinecap="round"      strokeLinejoin="round"      d="M4.5 4.5h15A2.25 2.25 0 0121.75 6.75v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75A2.25 2.25 0 014.5 4.5z"    />    {/* Browser top bar circles */}    <circle cx="7" cy="8" r="1" />    <circle cx="10" cy="8" r="1" />    <circle cx="13" cy="8" r="1" />    {/* Globe inside the window */}    <path      strokeLinecap="round"      strokeLinejoin="round"      d="M12 12a4 4 0 100 8 4 4 0 000-8zm0 0c1.5 1 1.5 3 0 4m0-4c-1.5 1-1.5 3 0 4m-3-2h6"    />  </svg>);export const UserIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />  </svg>);export const ArrowLeftOnRectangleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5-4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />  </svg>);export const CheckBadgeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">    <path d="M10.894 2.553a.961.961 0 0 0-1.788 0l-1.83 5.375H2.89a.96.96 0 0 0-.568 1.74l4.352 3.153-1.829 5.375c-.187.55.136 1.08.682 1.08.55 0 .975-.53.788-1.08l-1.83-5.375 4.352-3.153a.96.96 0 0 0-.568-1.74H7.672L5.842 2.553z" />  </svg>);
export const ExternalLinkIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
