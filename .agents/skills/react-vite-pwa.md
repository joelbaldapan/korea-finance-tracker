# React, Vite, & PWA Frontend Standards

You are building a mobile-first Progressive Web App (PWA) using React and Vite.

1. **PWA Configuration:** You must configure `vite-plugin-pwa` in `vite.config.ts` to generate a manifest, enabling users to add the app to their iOS or Android home screens. 
2. **Mobile-First UI:** Design specifically for mobile screens. Use a bottom navigation bar instead of a top header menu. 
3. **Tailwind CSS:** Use Tailwind CSS for all styling. Rely on Flexbox and CSS Grid. Account for mobile safe-area insets (e.g., `pb-safe`, `pt-safe`) so the UI doesn't overlap with the iOS notch or home indicator.
4. **State Management:** Use React Query (`@tanstack/react-query`) for fetching, caching, and updating asynchronous data like the transaction feed. Do not use standard `useEffect` for data fetching.