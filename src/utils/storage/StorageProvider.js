// Base class for all storage providers
// Each provider (Local, Google Drive, OneDrive, WebDAV) implements this interface

export class StorageProvider {
  constructor() {
    if (this.constructor === StorageProvider) {
      throw new Error('StorageProvider is abstract and cannot be instantiated directly')
    }
    this.name = 'Unknown'
    this.icon = '💾'
  }

  // Initialize the storage provider
  async init() {
    throw new Error('init() must be implemented')
  }

  // Check if user is authenticated (for cloud providers)
  isAuthenticated() {
    throw new Error('isAuthenticated() must be implemented')
  }

  // Authenticate user (for cloud providers)
  async authenticate() {
    throw new Error('authenticate() must be implemented')
  }

  // Sign out (for cloud providers)
  async signOut() {
    throw new Error('signOut() must be implemented')
  }

  // Get user info (email, name, etc.)
  getUserInfo() {
    return null
  }

  // === Ideas ===

  async getIdeas() {
    throw new Error('getIdeas() must be implemented')
  }

  async saveIdea(idea) {
    throw new Error('saveIdea() must be implemented')
  }

  async deleteIdea(id) {
    throw new Error('deleteIdea() must be implemented')
  }

  // === Chat History ===

  async getChatHistory() {
    throw new Error('getChatHistory() must be implemented')
  }

  async saveChatMessage(message) {
    throw new Error('saveChatMessage() must be implemented')
  }

  async clearChatHistory() {
    throw new Error('clearChatHistory() must be implemented')
  }

  // === Event System ===
  // Providers can emit events when data changes (for real-time sync)

  _listeners = {}

  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(callback)
  }

  off(event, callback) {
    if (!this._listeners[event]) return
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback)
  }

  _emit(event, data) {
    if (!this._listeners[event]) return
    this._listeners[event].forEach(cb => cb(data))
  }
}
