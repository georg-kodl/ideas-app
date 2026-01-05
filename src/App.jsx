import { useState, useEffect } from 'react'
import { getStoragePreference, initStorage, getStorage, clearStoragePreference, isStorageInitialized } from './utils/storage'
import StorageSelector from './components/StorageSelector'
import CapturePage from './components/CapturePage'
import IdeasList from './components/IdeasList'
import EnquiryPage from './components/EnquiryPage'

function App() {
  const [storageReady, setStorageReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('capture')
  const [storage, setStorage] = useState(null)

  useEffect(() => {
    const init = async () => {
      const preference = getStoragePreference()

      if (preference) {
        try {
          const provider = await initStorage(preference)
          setStorage(provider)
          setStorageReady(true)
        } catch (error) {
          console.error('Failed to init storage:', error)
          clearStoragePreference()
        }
      }

      setLoading(false)
    }

    init()
  }, [])

  const handleStorageSelect = async (providerId) => {
    const provider = await initStorage(providerId)
    setStorage(provider)
    setStorageReady(true)
  }

  const handleChangeStorage = () => {
    clearStoragePreference()
    setStorageReady(false)
    setStorage(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!storageReady) {
    return <StorageSelector onSelect={handleStorageSelect} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <img src="/android-chrome-192x192.png" alt="Logo" className="w-8 h-8" />
            Idea Capture
          </h1>
          <nav className="flex items-center gap-2">
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
            <button
              onClick={handleChangeStorage}
              className="ml-2 px-3 py-2 text-white/70 hover:text-white text-sm transition"
              title={`Storage: ${storage?.name || 'Unknown'}`}
            >
              {storage?.icon} Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'capture' && <CapturePage storage={storage} />}
        {view === 'list' && <IdeasList storage={storage} />}
        {view === 'enquiry' && <EnquiryPage storage={storage} />}
      </main>
    </div>
  )
}

export default App
