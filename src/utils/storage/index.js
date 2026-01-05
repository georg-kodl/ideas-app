// Storage provider manager
// Handles provider selection and persistence

import { LocalStorage } from './LocalStorage'
import { WebDAVStorage } from './WebDAVStorage'
import { GoogleDriveStorage } from './GoogleDriveStorage'
import { OneDriveStorage } from './OneDriveStorage'

const STORAGE_PREFERENCE_KEY = 'ideas-app-storage-provider'

// Available storage providers
export const StorageProviders = {
  local: {
    id: 'local',
    name: 'Local Storage',
    icon: '💻',
    description: 'Store on this device only. No account needed.',
    Provider: LocalStorage
  },
  googleDrive: {
    id: 'googleDrive',
    name: 'Google Drive',
    icon: '🔵',
    description: 'Store in your personal Google Drive.',
    Provider: GoogleDriveStorage,
    requiresAuth: true
  },
  oneDrive: {
    id: 'oneDrive',
    name: 'OneDrive',
    icon: '☁️',
    description: 'Store in your personal OneDrive.',
    Provider: OneDriveStorage,
    requiresAuth: true
  },
  webdav: {
    id: 'webdav',
    name: 'Self-hosted (WebDAV)',
    icon: '🏠',
    description: 'Store on your own server (Nextcloud, etc.)',
    Provider: WebDAVStorage,
    requiresSetup: true
  }
}

let currentProvider = null

// Get saved storage preference
export function getStoragePreference() {
  return localStorage.getItem(STORAGE_PREFERENCE_KEY) || null
}

// Set storage preference
export function setStoragePreference(providerId) {
  localStorage.setItem(STORAGE_PREFERENCE_KEY, providerId)
}

// Clear storage preference
export function clearStoragePreference() {
  localStorage.removeItem(STORAGE_PREFERENCE_KEY)
}

// Initialize and get the current storage provider
export async function initStorage(providerId) {
  const providerInfo = StorageProviders[providerId]
  
  if (!providerInfo) {
    throw new Error(`Unknown storage provider: ${providerId}`)
  }
  
  if (!providerInfo.Provider) {
    throw new Error(`Storage provider ${providerId} is not yet implemented`)
  }

  currentProvider = new providerInfo.Provider()
  await currentProvider.init()
  setStoragePreference(providerId)
  
  return currentProvider
}

// Get the current active provider
export function getStorage() {
  if (!currentProvider) {
    throw new Error('Storage not initialized. Call initStorage() first.')
  }
  return currentProvider
}

// Check if storage is initialized
export function isStorageInitialized() {
  return currentProvider !== null
}

// Export for convenience
export { LocalStorage }
