import { useState } from 'react'

export default function WebDAVSetup({ onConnect, onCancel }) {
  const [serverUrl, setServerUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onConnect({ serverUrl: serverUrl.trim(), username, password })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Connect to WebDAV Server
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Works with Nextcloud, ownCloud, Synology, and other WebDAV servers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Server URL
          </label>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://nextcloud.example.com/remote.php/webdav/"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Full WebDAV URL including path (e.g., /remote.php/webdav/ for Nextcloud)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="your-password or app-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            For Nextcloud with 2FA, use an app password from Settings → Security
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading || !serverUrl || !username || !password}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </form>
    </div>
  )
}
