# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

This is a React PWA for quick idea capture via voice or text, with user-owned storage and AI chat features.

### Tech Stack
- React 18 + Vite 5 + Tailwind CSS
- Storage abstraction with multiple providers (Local, Google Drive, OneDrive, WebDAV)
- vite-plugin-pwa for offline support
- Web Speech API for voice input
- Groq API for AI chat (free tier available)

### Key Files

**Core App:**
- `src/App.jsx` - Main app with navigation, storage initialization, and view routing
- `src/components/CapturePage.jsx` - Voice/text capture UI with auto-categorization
- `src/components/IdeasList.jsx` - Ideas display with category filtering, search, delete
- `src/components/EnquiryPage.jsx` - AI chat for brainstorming and summarizing ideas
- `src/components/StorageSelector.jsx` - First-run storage provider selection UI

**Storage System:**
- `src/utils/storage/index.js` - Storage provider manager, exports available providers
- `src/utils/storage/StorageProvider.js` - Abstract base class defining storage interface
- `src/utils/storage/LocalStorage.js` - IndexedDB implementation for local storage
- `src/utils/storage/GoogleDriveStorage.js` - Google Drive provider (OAuth via GIS)
- `src/utils/storage/OneDriveStorage.js` - OneDrive provider (OAuth via MSAL)
- `src/utils/storage/WebDAVStorage.js` - WebDAV provider for self-hosted servers
- `src/components/WebDAVSetup.jsx` - WebDAV credentials form

**Utilities:**
- `src/hooks/useVoiceCapture.js` - Web Speech API wrapper for voice transcription
- `src/utils/categorizer.js` - Keyword-based categorization logic
- `src/utils/aiChat.js` - Groq API integration for AI assistant

### Storage Provider Interface

All storage providers implement this interface:
```javascript
init()                    // Initialize provider
isAuthenticated()         // Check auth status (cloud providers)
getIdeas()               // Get all ideas
saveIdea(idea)           // Save new idea
deleteIdea(id)           // Delete idea by ID
getChatHistory()         // Get chat messages
saveChatMessage(message) // Save chat message
clearChatHistory()       // Clear all chat
on(event, callback)      // Subscribe to changes
off(event, callback)     // Unsubscribe
```

### Data Flow
1. User selects storage provider on first run (stored in localStorage)
2. User captures idea via voice (Web Speech API) or text input
3. `categorizeIdea()` categorizes using keyword matching
4. Idea saved via storage provider with text, category, timestamp
5. Components subscribe to storage events for real-time updates
6. AI Chat uses Groq API with ideas context for brainstorming

### Environment Variables

Required in `.env`:
- `VITE_GROQ_API_KEY` - Groq API key for AI chat (get free at console.groq.com)

Optional (for cloud storage):
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID for Google Drive
- `VITE_ONEDRIVE_CLIENT_ID` - Azure AD app client ID for OneDrive

### Cloud Storage Providers

All cloud providers store data as a single `ideas-app-data.json` file:
```json
{
  "version": 1,
  "ideas": [...],
  "chatHistory": [...]
}
```

**Google Drive:** Uses App Data folder (hidden from user). Requires Google Cloud project with Drive API enabled.

**OneDrive:** Uses App folder (`/Apps/Ideas Capture/`). Requires Azure AD app registration with `Files.ReadWrite.AppFolder` scope.

**WebDAV:** Works with Nextcloud, Synology, ownCloud, and other WebDAV servers. User provides server URL and credentials.

### Categories
Defined in `src/utils/categorizer.js`: Work, Household, DIY, Vacation, Cottage, Long-term Vision, Health & Fitness, Finance, Learning, Social, Other
