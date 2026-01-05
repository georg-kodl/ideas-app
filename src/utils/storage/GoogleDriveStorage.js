// Google Drive storage provider
// Uses Google Identity Services (GIS) for OAuth and Drive API for file operations
// Data stored in hidden App Data folder

import { StorageProvider } from './StorageProvider'

const DATA_FILE_NAME = 'ideas-app-data.json'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const TOKEN_KEY = 'ideas-app-google-token'

export class GoogleDriveStorage extends StorageProvider {
  constructor() {
    super()
    this.name = 'Google Drive'
    this.icon = '🔵'
    this.tokenClient = null
    this.accessToken = null
    this.userInfo = null
    this.fileId = null
    this.data = { version: 1, ideas: [], chatHistory: [] }
  }

  async init() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.warn('Google Drive: VITE_GOOGLE_CLIENT_ID not set')
      return
    }

    // Wait for GIS library to load
    await this._waitForGis()

    // Initialize token client
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: () => {} // Will be set during authenticate
    })

    // Try to restore session
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      try {
        const tokenData = JSON.parse(savedToken)
        // Check if token is still valid (with 5 min buffer)
        if (tokenData.expiresAt > Date.now() + 300000) {
          this.accessToken = tokenData.accessToken
          this.userInfo = tokenData.userInfo
          await this._loadData()
        }
      } catch (error) {
        console.warn('Google Drive: Failed to restore session:', error.message)
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  _waitForGis() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve()
        return
      }

      // Wait for script to load (max 10 seconds)
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(interval)
          resolve()
        } else if (attempts > 100) {
          clearInterval(interval)
          reject(new Error('Google Identity Services failed to load'))
        }
      }, 100)
    })
  }

  isAuthenticated() {
    return this.accessToken !== null
  }

  async authenticate() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error('Google Drive not configured. Set VITE_GOOGLE_CLIENT_ID in .env')
    }

    await this._waitForGis()

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }

        this.accessToken = response.access_token

        try {
          // Get user info
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${this.accessToken}` }
          })
          const userData = await userResponse.json()
          this.userInfo = { name: userData.name, email: userData.email }

          // Save token with expiry
          const tokenData = {
            accessToken: this.accessToken,
            userInfo: this.userInfo,
            expiresAt: Date.now() + (response.expires_in * 1000)
          }
          localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData))

          // Load data
          await this._loadData()
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      // Request access token
      this.tokenClient.requestAccessToken({ prompt: 'consent' })
    })
  }

  async signOut() {
    if (this.accessToken) {
      // Revoke token
      google.accounts.oauth2.revoke(this.accessToken)
    }

    localStorage.removeItem(TOKEN_KEY)
    this.accessToken = null
    this.userInfo = null
    this.fileId = null
    this.data = { version: 1, ideas: [], chatHistory: [] }
  }

  getUserInfo() {
    return this.userInfo
  }

  // === Private Methods ===

  async _apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear auth
        this.accessToken = null
        localStorage.removeItem(TOKEN_KEY)
        throw new Error('Session expired. Please sign in again.')
      }
      throw new Error(`API error: ${response.status}`)
    }

    return response
  }

  async _findDataFile() {
    const response = await this._apiRequest(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DATA_FILE_NAME}'&fields=files(id,name)`
    )
    const data = await response.json()
    return data.files?.[0]?.id || null
  }

  async _loadData() {
    try {
      // Find existing data file
      this.fileId = await this._findDataFile()

      if (this.fileId) {
        // Download file content
        const response = await this._apiRequest(
          `https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`
        )
        this.data = await response.json()

        // Ensure data structure
        if (!this.data.version) this.data.version = 1
        if (!this.data.ideas) this.data.ideas = []
        if (!this.data.chatHistory) this.data.chatHistory = []
      } else {
        // Create new data file
        await this._saveData()
      }
    } catch (error) {
      console.error('Google Drive: Failed to load data:', error)
      throw error
    }
  }

  async _saveData() {
    try {
      const content = JSON.stringify(this.data, null, 2)
      const blob = new Blob([content], { type: 'application/json' })

      if (this.fileId) {
        // Update existing file
        await this._apiRequest(
          `https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`,
          {
            method: 'PATCH',
            body: blob
          }
        )
      } else {
        // Create new file in App Data folder
        const metadata = {
          name: DATA_FILE_NAME,
          parents: ['appDataFolder']
        }

        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        form.append('file', blob)

        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.accessToken}` },
            body: form
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to create file: ${response.status}`)
        }

        const result = await response.json()
        this.fileId = result.id
      }
    } catch (error) {
      console.error('Google Drive: Failed to save data:', error)
      throw error
    }
  }

  // === Ideas ===

  async getIdeas() {
    await this._loadData()
    return [...this.data.ideas].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  }

  async saveIdea(idea) {
    const ideaWithId = {
      ...idea,
      id: idea.id || Date.now().toString(),
      createdAt: idea.createdAt || new Date().toISOString()
    }

    const existingIndex = this.data.ideas.findIndex(i => i.id === ideaWithId.id)
    if (existingIndex >= 0) {
      this.data.ideas[existingIndex] = ideaWithId
    } else {
      this.data.ideas.push(ideaWithId)
    }

    await this._saveData()
    this._emit('ideasChanged')
    return ideaWithId
  }

  async deleteIdea(id) {
    this.data.ideas = this.data.ideas.filter(idea => idea.id !== id)
    await this._saveData()
    this._emit('ideasChanged')
  }

  // === Chat History ===

  async getChatHistory() {
    await this._loadData()
    return [...this.data.chatHistory].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    )
  }

  async saveChatMessage(message) {
    const messageWithId = {
      ...message,
      id: message.id || Date.now().toString(),
      timestamp: message.timestamp || new Date().toISOString()
    }

    const existingIndex = this.data.chatHistory.findIndex(m => m.id === messageWithId.id)
    if (existingIndex >= 0) {
      this.data.chatHistory[existingIndex] = messageWithId
    } else {
      this.data.chatHistory.push(messageWithId)
    }

    await this._saveData()
    this._emit('chatChanged')
    return messageWithId
  }

  async clearChatHistory() {
    this.data.chatHistory = []
    await this._saveData()
    this._emit('chatChanged')
  }
}
