import { useState } from 'react'
import { StorageProviders, initStorage } from '../utils/storage'
import WebDAVSetup from './WebDAVSetup'

export default function StorageSelector({ onSelect }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWebDAVSetup, setShowWebDAVSetup] = useState(false)

  const handleSelect = async () => {
    if (!selected) return

    const provider = StorageProviders[selected]

    // WebDAV needs credentials form
    if (selected === 'webdav') {
      setShowWebDAVSetup(true)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Initialize the provider
      const storageInstance = await initStorage(selected)

      // Cloud providers need OAuth authentication
      if (provider.requiresAuth && !storageInstance.isAuthenticated()) {
        await storageInstance.authenticate()
      }

      await onSelect(selected)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleWebDAVConnect = async (credentials) => {
    setLoading(true)
    setError('')

    try {
      const storageInstance = await initStorage('webdav')
      await storageInstance.authenticate(credentials)
      await onSelect('webdav')
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err // Re-throw for WebDAVSetup to handle
    }
  }

  const handleWebDAVCancel = () => {
    setShowWebDAVSetup(false)
    setSelected(null)
  }

  // Check if a provider is available (has required env vars)
  const isProviderAvailable = (providerId) => {
    if (providerId === 'googleDrive') {
      return !!import.meta.env.VITE_GOOGLE_CLIENT_ID
    }
    if (providerId === 'oneDrive') {
      return !!import.meta.env.VITE_ONEDRIVE_CLIENT_ID
    }
    return true
  }

  if (showWebDAVSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
          <WebDAVSetup onConnect={handleWebDAVConnect} onCancel={handleWebDAVCancel} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/android-chrome-192x192.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Where should we store your ideas?</h1>
          <p className="text-gray-500 mt-2">You own your data. Choose where it lives.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {Object.values(StorageProviders).map((provider) => {
            const available = isProviderAvailable(provider.id)
            const needsConfig = provider.requiresAuth && !available

            return (
              <button
                key={provider.id}
                onClick={() => !needsConfig && setSelected(provider.id)}
                disabled={loading || needsConfig}
                className={`w-full p-4 rounded-xl border-2 transition text-left flex items-start gap-4 ${
                  selected === provider.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${loading || needsConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-3xl">{provider.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {provider.name}
                    {needsConfig && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        Needs Setup
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {needsConfig
                      ? `Set ${provider.id === 'googleDrive' ? 'VITE_GOOGLE_CLIENT_ID' : 'VITE_ONEDRIVE_CLIENT_ID'} in .env`
                      : provider.description}
                  </p>
                </div>
                {selected === provider.id && (
                  <span className="text-indigo-600 text-xl">✓</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleSelect}
          disabled={!selected || loading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            !selected || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Setting up...' : 'Continue'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          You can change this later in settings
        </p>
      </div>
    </div>
  )
}
