import { useState } from 'react'
import CapturePage from './components/CapturePage'
import IdeasList from './components/IdeasList'
import EnquiryPage from './components/EnquiryPage'

function App() {
  const [view, setView] = useState('capture') // 'capture', 'list', or 'enquiry'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <img src="/android-chrome-192x192.png" alt="Logo" className="w-8 h-8" />
            Idea Capture
          </h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setView('capture')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                view === 'capture'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Capture
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                view === 'list'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Ideas
            </button>
            <button
              onClick={() => setView('enquiry')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                view === 'enquiry'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              AI Chat
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'capture' && <CapturePage />}
        {view === 'list' && <IdeasList />}
        {view === 'enquiry' && <EnquiryPage />}
      </main>
    </div>
  )
}

export default App
