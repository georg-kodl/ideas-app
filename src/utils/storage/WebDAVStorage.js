// WebDAV storage provider for self-hosted servers (Nextcloud, Synology, etc.)
// Data stored as a single JSON file on user's WebDAV server

import { StorageProvider } from './StorageProvider'
import { createClient } from 'webdav'

const CREDENTIALS_KEY = 'ideas-app-webdav-credentials'
const DATA_FILE = 'ideas-app-data.json'

export class WebDAVStorage extends StorageProvider {
  constructor() {
    super()
    this.name = 'Self-hosted (WebDAV)'
    this.icon = '🏠'
    this.client = null
    this.credentials = null
    this.data = { version: 1, ideas: [], chatHistory: [] }
  }

  async init() {
    // Try to restore saved credentials
    const saved = localStorage.getItem(CREDENTIALS_KEY)
    if (saved) {
      try {
        this.credentials = JSON.parse(saved)
        await this._connect()
        await this._loadData()
      } catch (error) {
        // Credentials invalid or server unreachable
        console.warn('WebDAV: Failed to restore session:', error.message)
        this.credentials = null
        this.client = null
      }
    }
  }

  isAuthenticated() {
    return this.client !== null && this.credentials !== null
  }

  async authenticate(credentials) {
    if (!credentials) {
      throw new Error('WebDAV credentials required')
    }

    const { serverUrl, username, password } = credentials

    if (!serverUrl || !username || !password) {
      throw new Error('Server URL, username, and password are required')
    }

    this.credentials = { serverUrl, username, password }

    try {
      await this._connect()
      // Test connection by trying to access the directory
      await this.client.getDirectoryContents('/')

      // Save credentials on successful connection
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(this.credentials))

      // Load existing data or create new
      await this._loadData()
    } catch (error) {
      this.credentials = null
      this.client = null
      throw new Error(`Failed to connect: ${error.message}`)
    }
  }

  async signOut() {
    localStorage.removeItem(CREDENTIALS_KEY)
    this.credentials = null
    this.client = null
    this.data = { version: 1, ideas: [], chatHistory: [] }
  }

  getUserInfo() {
    if (!this.credentials) return null
    return {
      name: this.credentials.username,
      email: null,
      server: this.credentials.serverUrl
    }
  }

  // === Private Methods ===

  async _connect() {
    const { serverUrl, username, password } = this.credentials

    this.client = createClient(serverUrl, {
      username,
      password
    })
  }

  async _loadData() {
    try {
      const exists = await this.client.exists(DATA_FILE)

      if (exists) {
        const content = await this.client.getFileContents(DATA_FILE, { format: 'text' })
        this.data = JSON.parse(content)

        // Ensure data structure
        if (!this.data.version) this.data.version = 1
        if (!this.data.ideas) this.data.ideas = []
        if (!this.data.chatHistory) this.data.chatHistory = []
      } else {
        // Create new data file
        await this._saveData()
      }
    } catch (error) {
      console.error('WebDAV: Failed to load data:', error)
      throw error
    }
  }

  async _saveData() {
    try {
      const content = JSON.stringify(this.data, null, 2)
      await this.client.putFileContents(DATA_FILE, content, { overwrite: true })
    } catch (error) {
      console.error('WebDAV: Failed to save data:', error)
      throw error
    }
  }

  // === Ideas ===

  async getIdeas() {
    await this._loadData() // Refresh from server
    // Return newest first
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

    // Check if updating existing idea
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
    await this._loadData() // Refresh from server
    // Return oldest first for chat
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

    // Check if updating existing message
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
