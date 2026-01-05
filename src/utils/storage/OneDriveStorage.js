// OneDrive storage provider
// Uses Microsoft Authentication Library (MSAL) for OAuth
// Data stored in OneDrive's App folder

import { StorageProvider } from './StorageProvider'
import { PublicClientApplication } from '@azure/msal-browser'

const DATA_FILE_NAME = 'ideas-app-data.json'
const APP_FOLDER_PATH = '/drive/special/approot'

export class OneDriveStorage extends StorageProvider {
  constructor() {
    super()
    this.name = 'OneDrive'
    this.icon = '☁️'
    this.msalInstance = null
    this.account = null
    this.data = { version: 1, ideas: [], chatHistory: [] }
  }

  async init() {
    const clientId = import.meta.env.VITE_ONEDRIVE_CLIENT_ID
    if (!clientId) {
      console.warn('OneDrive: VITE_ONEDRIVE_CLIENT_ID not set')
      return
    }

    // Initialize MSAL
    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
      }
    })

    await this.msalInstance.initialize()

    // Handle redirect response
    try {
      const response = await this.msalInstance.handleRedirectPromise()
      if (response) {
        this.account = response.account
      }
    } catch (error) {
      console.error('OneDrive: Redirect handling error:', error)
    }

    // Check for existing account
    const accounts = this.msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      this.account = accounts[0]
      try {
        await this._loadData()
      } catch (error) {
        console.warn('OneDrive: Failed to load data on init:', error.message)
      }
    }
  }

  isAuthenticated() {
    return this.account !== null
  }

  async authenticate() {
    const clientId = import.meta.env.VITE_ONEDRIVE_CLIENT_ID
    if (!clientId) {
      throw new Error('OneDrive not configured. Set VITE_ONEDRIVE_CLIENT_ID in .env')
    }

    if (!this.msalInstance) {
      throw new Error('OneDrive not initialized')
    }

    try {
      // Try popup login first
      const response = await this.msalInstance.loginPopup({
        scopes: ['Files.ReadWrite.AppFolder', 'User.Read']
      })

      this.account = response.account
      await this._loadData()
    } catch (error) {
      if (error.name === 'BrowserAuthError') {
        // Popup blocked, try redirect
        await this.msalInstance.loginRedirect({
          scopes: ['Files.ReadWrite.AppFolder', 'User.Read']
        })
      } else {
        throw error
      }
    }
  }

  async signOut() {
    if (this.msalInstance && this.account) {
      await this.msalInstance.logoutPopup({
        account: this.account
      })
    }

    this.account = null
    this.data = { version: 1, ideas: [], chatHistory: [] }
  }

  getUserInfo() {
    if (!this.account) return null
    return {
      name: this.account.name,
      email: this.account.username
    }
  }

  // === Private Methods ===

  async _getAccessToken() {
    if (!this.msalInstance || !this.account) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.AppFolder'],
        account: this.account
      })
      return response.accessToken
    } catch (error) {
      // Silent token acquisition failed, try interactive
      const response = await this.msalInstance.acquireTokenPopup({
        scopes: ['Files.ReadWrite.AppFolder'],
        account: this.account
      })
      return response.accessToken
    }
  }

  async _apiRequest(endpoint, options = {}) {
    const accessToken = await this._getAccessToken()

    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.account = null
        throw new Error('Session expired. Please sign in again.')
      }
      if (response.status === 404) {
        return null // File not found
      }
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    return response
  }

  async _loadData() {
    try {
      // Try to get existing file
      const response = await this._apiRequest(`${APP_FOLDER_PATH}:/${DATA_FILE_NAME}:/content`)

      if (response) {
        this.data = await response.json()

        // Ensure data structure
        if (!this.data.version) this.data.version = 1
        if (!this.data.ideas) this.data.ideas = []
        if (!this.data.chatHistory) this.data.chatHistory = []
      } else {
        // File doesn't exist, create it
        await this._saveData()
      }
    } catch (error) {
      if (error.message.includes('404')) {
        // File doesn't exist, create it
        await this._saveData()
      } else {
        console.error('OneDrive: Failed to load data:', error)
        throw error
      }
    }
  }

  async _saveData() {
    try {
      const content = JSON.stringify(this.data, null, 2)

      await this._apiRequest(
        `${APP_FOLDER_PATH}:/${DATA_FILE_NAME}:/content`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: content
        }
      )
    } catch (error) {
      console.error('OneDrive: Failed to save data:', error)
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
