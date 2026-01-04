import { useState, useEffect } from 'react'
import CapturePage from './components/CapturePage'
import IdeasList from './components/IdeasList'
import { auth } from './firebase'
import { signInAnonymously } from 'firebase/auth'

function App() {
  const [view, setView] = useState('capture') // 'capture' or 'list'
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auto sign-in anonymously for private but easy access
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        setLoading(false)
      } else {
        // Sign in anonymously if not signed in
        try {
          const result = await signInAnonymously(auth)
          setUser(result.user)
        } catch (error) {
          console.error('Auth error:', error)
        } finally {
          setLoading(false)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

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
          <CapturePage userId={user?.uid} />
        ) : (
          <IdeasList userId={user?.uid} />
        )}
      </main>
    </div>
  )
}

export default App
