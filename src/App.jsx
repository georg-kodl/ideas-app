import { useState } from 'react'
import CapturePage from './components/CapturePage'
import IdeasList from './components/IdeasList'

function App() {
  const [view, setView] = useState('capture') // 'capture' or 'list'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">💡 Idea Capture</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => setView('capture')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'capture'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Capture
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'list'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              My Ideas
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'capture' ? (
          <CapturePage />
        ) : (
          <IdeasList />
        )}
      </main>
    </div>
  )
}

export default App
