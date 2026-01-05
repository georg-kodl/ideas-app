// Local storage provider using IndexedDB
// Data stays on device only, no account needed

import { StorageProvider } from './StorageProvider'

const DB_NAME = 'IdeaCaptureDB'
const DB_VERSION = 1

export class LocalStorage extends StorageProvider {
  constructor() {
    super()
    this.name = 'Local Storage'
    this.icon = '💻'
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Ideas store
        if (!db.objectStoreNames.contains('ideas')) {
          const ideasStore = db.createObjectStore('ideas', { keyPath: 'id' })
          ideasStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Chat history store
        if (!db.objectStoreNames.contains('chatHistory')) {
          const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id' })
          chatStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  isAuthenticated() {
    return true // Local storage doesn't need auth
  }

  async authenticate() {
    // No-op for local storage
  }

  async signOut() {
    // No-op for local storage
  }

  getUserInfo() {
    return { name: 'Local User', email: null }
  }

  // === Ideas ===

  async getIdeas() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['ideas'], 'readonly')
      const store = transaction.objectStore('ideas')
      const index = store.index('createdAt')
      const request = index.openCursor(null, 'prev') // Newest first

      const ideas = []
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          ideas.push(cursor.value)
          cursor.continue()
        } else {
          resolve(ideas)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async saveIdea(idea) {
    const ideaWithId = {
      ...idea,
      id: idea.id || Date.now().toString(),
      createdAt: idea.createdAt || new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['ideas'], 'readwrite')
      const store = transaction.objectStore('ideas')
      const request = store.put(ideaWithId)

      request.onsuccess = () => {
        this._emit('ideasChanged')
        resolve(ideaWithId)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteIdea(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['ideas'], 'readwrite')
      const store = transaction.objectStore('ideas')
      const request = store.delete(id)

      request.onsuccess = () => {
        this._emit('ideasChanged')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // === Chat History ===

  async getChatHistory() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['chatHistory'], 'readonly')
      const store = transaction.objectStore('chatHistory')
      const index = store.index('timestamp')
      const request = index.openCursor() // Oldest first for chat

      const messages = []
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          messages.push(cursor.value)
          cursor.continue()
        } else {
          resolve(messages)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async saveChatMessage(message) {
    const messageWithId = {
      ...message,
      id: message.id || Date.now().toString(),
      timestamp: message.timestamp || new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['chatHistory'], 'readwrite')
      const store = transaction.objectStore('chatHistory')
      const request = store.put(messageWithId)

      request.onsuccess = () => {
        this._emit('chatChanged')
        resolve(messageWithId)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearChatHistory() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['chatHistory'], 'readwrite')
      const store = transaction.objectStore('chatHistory')
      const request = store.clear()

      request.onsuccess = () => {
        this._emit('chatChanged')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }
}
