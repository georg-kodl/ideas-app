import { useState } from 'react'
import { useVoiceCapture } from '../hooks/useVoiceCapture'
import { categorizeIdea } from '../utils/categorizer'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function CapturePage({ userId }) {
  const [textInput, setTextInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceCapture()

  const handleSaveIdea = async (text) => {
    if (!text.trim()) return

    setIsSaving(true)
    setSavedMessage('')

    try {
      // Categorize the idea
      const category = await categorizeIdea(text)

      // Save to Firebase
      await addDoc(collection(db, 'ideas'), {
        userId,
        text: text.trim(),
        category,
        createdAt: serverTimestamp(),
        type: 'text' // Can be 'text', 'voice', or 'image' later
      })

      setSavedMessage(`✓ Saved to ${category}!`)
      setTextInput('')
      resetTranscript()

      // Clear success message after 3 seconds
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Error saving idea:', error)
      setSavedMessage('✗ Error saving idea')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVoiceCapture = () => {
    if (isListening) {
      stopListening()
      if (transcript.trim()) {
        handleSaveIdea(transcript)
      }
    } else {
      startListening()
    }
  }

  return (
    <div className="space-y-8">
      {/* Success/Error Message */}
      {savedMessage && (
        <div className={`text-center p-4 rounded-lg ${
          savedMessage.includes('✓')
            ? 'bg-green-500/20 text-green-100'
            : 'bg-red-500/20 text-red-100'
        }`}>
          {savedMessage}
        </div>
      )}

      {/* Voice Capture Section */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          Capture Your Idea
        </h2>

        {/* Big Voice Button */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleVoiceCapture}
            disabled={!isSupported || isSaving}
            className={`w-40 h-40 rounded-full flex items-center justify-center text-6xl transition-all transform ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
            } ${
              !isSupported || isSaving ? 'opacity-50 cursor-not-allowed' : 'shadow-2xl'
            }`}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>

          <p className="text-gray-600 text-center">
            {!isSupported
              ? 'Voice input not supported in this browser'
              : isListening
                ? 'Tap to stop recording'
                : 'Tap to start recording'
            }
          </p>

          {/* Live Transcript */}
          {transcript && (
            <div className="w-full p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
              <p className="text-gray-700 italic">"{transcript}"</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500 font-medium">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Text Input Section */}
        <div className="space-y-4">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your idea here..."
            className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
            rows={5}
          />

          <button
            onClick={() => handleSaveIdea(textInput)}
            disabled={!textInput.trim() || isSaving}
            className={`w-full py-4 text-white font-bold text-lg rounded-lg transition ${
              !textInput.trim() || isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Idea'}
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-3">💡 Quick Tips:</h3>
        <ul className="space-y-2 text-sm">
          <li>• Voice is fastest - just tap and speak!</li>
          <li>• Your ideas are automatically categorized</li>
          <li>• Add this app to your home screen for quick access</li>
          <li>• All data is private and stored securely</li>
        </ul>
      </div>
    </div>
  )
}
