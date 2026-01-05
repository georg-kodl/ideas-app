# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

This is a React PWA for quick idea capture via voice or text, with Firebase backend and optional AI categorization.

### Tech Stack
- React 18 + Vite 5 + Tailwind CSS
- Firebase (Anonymous Auth + Firestore)
- vite-plugin-pwa for offline support
- Web Speech API for voice input
- OpenAI API (optional) for AI categorization

### Key Files

- `src/App.jsx` - Main app with navigation between Capture and Ideas List views, handles anonymous Firebase auth
- `src/components/CapturePage.jsx` - Voice/text capture UI, saves ideas to Firestore with auto-categorization
- `src/components/IdeasList.jsx` - Displays ideas with category filtering, search, and delete functionality
- `src/hooks/useVoiceCapture.js` - Web Speech API wrapper for voice transcription
- `src/utils/categorizer.js` - Categorization logic (AI via OpenAI or keyword-based fallback)
- `src/firebase.js` - Firebase initialization (auth, db exports)
- `vite.config.js` - PWA manifest and service worker configuration

### Data Flow
1. User captures idea via voice (Web Speech API) or text input
2. `categorizeIdea()` categorizes using OpenAI (if API key set) or keyword matching
3. Idea saved to Firestore with userId, text, category, timestamp
4. IdeasList uses real-time Firestore listener for live updates

### Environment Variables
Required Firebase config in `.env`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Optional:
- `VITE_OPENAI_API_KEY` - Enables AI categorization (falls back to keyword matching if not set)

### Categories
Defined in `src/utils/categorizer.js`: Work, Household, DIY, Vacation, Cottage, Long-term Vision, Health & Fitness, Finance, Learning, Social, Other
