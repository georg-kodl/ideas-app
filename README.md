# 💡 Idea Capture App

A fast, Shazam-like idea capture app that lets you quickly save your thoughts via voice or text. Ideas are automatically categorized using AI and stored securely in the cloud.

## ✨ Features

- 🎤 **Voice Input**: Tap and speak to capture ideas instantly
- ⌨️ **Text Input**: Type your ideas when voice isn't convenient
- 🤖 **Auto-Categorization**: AI-powered categorization (Work, Household, DIY, etc.)
- 📱 **PWA**: Install on Android home screen for instant access
- ☁️ **Cloud Sync**: Your ideas are stored securely in Firebase
- 🔒 **Private**: Anonymous authentication - your data is private
- ⚡ **Offline Ready**: Works offline with service worker caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Firebase account (free tier works fine)
- Optional: OpenAI API key for enhanced AI categorization

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ideas-app
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Anonymous Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Anonymous" provider
4. Create a **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in **production mode**
   - Choose a location close to you
5. Set up **Firestore Security Rules**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ideas/{ideaId} {
         allow read, write: if request.auth != null &&
                             request.resource.data.userId == request.auth.uid;
       }
     }
   }
   ```
6. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the config values

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional - for AI categorization
VITE_OPENAI_API_KEY=sk-your_openai_key
```

### 4. Create PWA Icons

Replace placeholder icons with real ones:

1. Create a 512x512 icon (lightbulb or idea concept)
2. Use [favicon.io](https://favicon.io) or similar to generate:
   - `public/icon-192.png` (192x192)
   - `public/icon-512.png` (512x512)
   - `public/favicon.ico`

### 5. Run the App

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Installing on Android

1. Open the app in Chrome on your Android device
2. Tap the menu (three dots) → "Install app" or "Add to Home screen"
3. The app icon will appear on your home screen
4. Tap to launch instantly like a native app!

## 🎯 Usage

### Capturing Ideas

**Voice Method:**
1. Tap the big microphone button
2. Speak your idea
3. Tap the stop button (it auto-saves)

**Text Method:**
1. Type in the text area
2. Tap "Save Idea"

### Viewing Ideas

- Switch to "My Ideas" tab
- Filter by category using the pills
- Search across all ideas
- Delete ideas by tapping the trash icon

## 🤖 AI Categorization

The app supports two categorization modes:

1. **AI-Powered** (if OpenAI API key is provided):
   - Uses GPT-3.5-turbo for smart categorization
   - More accurate and context-aware

2. **Keyword-Based** (fallback):
   - Uses keyword matching
   - Works offline
   - No API costs

Categories include:
- Work
- Household
- DIY
- Vacation
- Cottage
- Long-term Vision
- Health & Fitness
- Finance
- Learning
- Social
- Other

## 🔧 Customization

### Adding New Categories

Edit `src/utils/categorizer.js`:

```javascript
const CATEGORIES = [
  'Work',
  'Household',
  // Add your custom category here
  'Custom Category'
]

const CATEGORY_KEYWORDS = {
  'Custom Category': ['keyword1', 'keyword2', 'keyword3']
}
```

### Changing Colors/Theme

Edit `vite.config.js` to change the PWA theme color:

```javascript
manifest: {
  theme_color: '#your-color',
  background_color: '#your-color'
}
```

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build the app
npm run build

# Deploy
firebase deploy
```

### Other Hosting Options

The built app in `/dist` folder can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🔮 Future Enhancements

- [ ] Image capture and upload
- [ ] Idea linking and connections
- [ ] Folder suggestions for related ideas
- [ ] Tags and custom labels
- [ ] Search with filters
- [ ] Export ideas (PDF, JSON)
- [ ] Idea summaries and insights
- [ ] Dark mode

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **PWA**: vite-plugin-pwa
- **Voice**: Web Speech API
- **AI**: OpenAI API (optional)

## 📝 License

MIT License - feel free to use and modify as you wish!

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## ❓ Troubleshooting

### Voice input not working
- Voice only works on HTTPS or localhost
- Check browser compatibility (Chrome/Edge work best)
- Grant microphone permissions when prompted

### Ideas not saving
- Check Firebase credentials in `.env`
- Verify Firestore security rules allow anonymous users
- Check browser console for errors

### PWA not installing
- App must be served over HTTPS (except localhost)
- Service worker must register successfully
- Check `manifest.json` is accessible

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for quick idea capture on the go!
